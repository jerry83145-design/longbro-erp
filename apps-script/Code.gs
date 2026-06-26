const CONFIG = {
  projectId: "longbroerp",
  databaseId: "(default)",
  rootFolderName: "\u9686\u535aERP\u6191\u8b49",
  adminVoucherListFolderId: "1POTpxGEPNQB3xDp4gkzjPQ-nYLuQAFsZ",
  adminVoucherImageFolderId: "1oCzWPjoL5lIwaJJxpnAx_hQ0x2m5yHfI",
  sharedSecret: "74185296",
};

function doGet(event) {
  try {
    const params = event && event.parameter ? event.parameter : {};
    if (params.action === "scanInvoiceNumbers") {
      const payload = {
        secret: params.secret || "",
        files: params.files ? JSON.parse(params.files) : [],
      };
      const result = scanInvoiceNumbersFromPayload(payload);
      return jsonpOrJsonOutput(result, params.callback);
    }

    if (params.action === "readAdminVoucherFolders") {
      const payload = {
        secret: params.secret || "",
        userId: params.userId || "",
        userEmail: params.userEmail || "",
      };
      const result = readAdminVoucherFolders(payload);
      return jsonpOrJsonOutput(result, params.callback);
    }

    return jsonpOrJsonOutput({
      ok: true,
      service: "longbro-erp-line-backend",
      message: "LINE backend is ready.",
      checkedAt: new Date().toISOString(),
    }, params.callback);
  } catch (error) {
    return jsonpOrJsonOutput({ ok: false, error: String(error && error.message ? error.message : error) }, event && event.parameter && event.parameter.callback);
  }
}

function doPost(event) {
  try {
    const payload = parsePayload(event);
    if (payload.secret !== CONFIG.sharedSecret) {
      return jsonOutput({ ok: false, error: "secret is invalid" });
    }

    if (payload.action === "scanInvoiceNumbers") {
      return jsonOutput(scanInvoiceNumbersFromPayload(payload));
    }

    if (payload.action === "readAdminVoucherFolders") {
      return jsonOutput(readAdminVoucherFolders(payload));
    }

    const draft = payload.draft || {};
    const files = Array.isArray(payload.files) ? payload.files : [];
    const lineProfile = payload.lineProfile || {};
    let uploadedFiles = [];
    let uploadError = "";
    try {
      uploadedFiles = uploadVoucherFiles(files, draft);
    } catch (error) {
      uploadError = String(error && error.message ? error.message : error);
    }
    const voucherLinks = []
      .concat(Array.isArray(draft.voucherLinks) ? draft.voucherLinks : [])
      .concat(uploadedFiles.map(function (file) { return file.webViewLink; }).filter(Boolean));

    const documentName = createFirestoreDocument("lineDrafts", {
      type: draft.type || "expense",
      date: draft.date || "",
      amount: Number(draft.amount || 0),
      counterparty: draft.counterparty || "",
      item: draft.item || "",
      cashflow: draft.cashflow || "",
      account: draft.account || "",
      major: draft.major || "",
      middle: draft.middle || "",
      minor: draft.minor || "",
      dueDate: draft.dueDate || "",
      invoiceNumber: String(draft.invoiceNumber || "").trim().toUpperCase(),
      note: draft.note || "",
      voucherLinks: voucherLinks,
      voucherFiles: uploadedFiles,
      voucherUploadStatus: uploadError ? "failed" : (files.length ? "uploaded" : "none"),
      voucherUploadError: uploadError,
      status: "draft",
      needsReview: true,
      source: "line-liff",
      lineUserId: lineProfile.userId || "",
      lineDisplayName: lineProfile.displayName || "",
      createdBy: lineProfile.displayName || "LINE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return jsonOutput({
      ok: true,
      documentName: documentName,
      uploadedCount: uploadedFiles.length,
      expectedUploadCount: files.length,
      uploadError: uploadError,
    });
  } catch (error) {
    return jsonOutput({ ok: false, error: String(error && error.message ? error.message : error) });
  }
}

function parsePayload(event) {
  const raw = String(event && event.postData && event.postData.contents ? event.postData.contents : "{}");
  return JSON.parse(raw.replace(/^\uFEFF/, ""));
}

function uploadVoucherFiles(files, draft) {
  if (!files.length) return [];
  const month = String(draft.date || "no-date").slice(0, 7);
  const rootFolder = ensureFolder(CONFIG.rootFolderName);
  const monthFolder = ensureFolder(month || "no-date", rootFolder);

  return files.map(function (file, index) {
    const bytes = Utilities.base64Decode(file.base64 || "");
    const blob = Utilities.newBlob(
      bytes,
      file.mimeType || "application/octet-stream",
      buildFileName(file, draft, index + 1)
    );
    const uploaded = monthFolder.createFile(blob);
    return {
      id: uploaded.getId(),
      name: uploaded.getName(),
      mimeType: uploaded.getMimeType(),
      webViewLink: uploaded.getUrl(),
      originalName: file.name || "",
      size: Number(file.size || 0),
    };
  });
}

function ensureFolder(name, parentFolder) {
  const folders = parentFolder ? parentFolder.getFoldersByName(name) : DriveApp.getFoldersByName(name);
  if (folders.hasNext()) return folders.next();
  return parentFolder ? parentFolder.createFolder(name) : DriveApp.createFolder(name);
}

function buildFileName(file, draft, index) {
  const typeLabel = draft.type === "income" ? "income" : "expense";
  const ext = file.name && file.name.indexOf(".") >= 0 ? file.name.slice(file.name.lastIndexOf(".")) : "";
  const counterparty = sanitizeFileName(draft.counterparty || "no-counterparty");
  const item = sanitizeFileName(draft.item || "no-item");
  return [
    draft.date || "no-date",
    typeLabel,
    counterparty,
    item,
    String(index).padStart(2, "0"),
  ].join("_") + ext;
}

function sanitizeFileName(value) {
  return String(value)
    .replace(/[\\/:*?"<>|#%{}~&]/g, "-")
    .replace(/\s+/g, "")
    .slice(0, 40);
}

function createFirestoreDocument(collectionName, data) {
  const url =
    "https://firestore.googleapis.com/v1/projects/" +
    CONFIG.projectId +
    "/databases/" +
    CONFIG.databaseId +
    "/documents/" +
    collectionName;

  const response = UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    headers: {
      Authorization: "Bearer " + ScriptApp.getOAuthToken(),
    },
    payload: JSON.stringify({ fields: toFirestoreFields(data) }),
    muteHttpExceptions: true,
  });

  const code = response.getResponseCode();
  const body = response.getContentText();
  if (code < 200 || code >= 300) {
    throw new Error("Firestore write failed: " + body);
  }

  return JSON.parse(body).name;
}

function toFirestoreFields(value) {
  const fields = {};
  Object.keys(value).forEach(function (key) {
    fields[key] = toFirestoreValue(value[key]);
  });
  return fields;
}

function toFirestoreValue(value) {
  if (value === null || value === undefined) return { nullValue: null };
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(function (item) { return toFirestoreValue(item); }) } };
  }
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") {
    return Number.isInteger(value) ? { integerValue: value } : { doubleValue: value };
  }
  if (typeof value === "object") return { mapValue: { fields: toFirestoreFields(value) } };
  return { stringValue: String(value) };
}

function readAdminVoucherFolders(payload) {
  if (payload.secret !== CONFIG.sharedSecret) {
    return { ok: false, error: "secret is invalid" };
  }

  const imageIndex = buildDriveImageIndex(CONFIG.adminVoucherImageFolderId);
  const listFiles = listDriveFolderFiles(CONFIG.adminVoucherListFolderId);
  const vouchers = [];
  const files = [];

  listFiles.forEach(function (file) {
    try {
      const rows = readVoucherRowsFromDriveFile(file);
      rows.forEach(function (row) {
        const voucher = parseAdminVoucherRow(row.values, row.sourceRow, file.name, imageIndex, payload);
        if (voucher) vouchers.push(voucher);
      });
      files.push({ id: file.id, name: file.name, rowCount: rows.length, ok: true });
    } catch (error) {
      files.push({ id: file.id, name: file.name, rowCount: 0, ok: false, error: String(error && error.message ? error.message : error) });
    }
  });

  return {
    ok: true,
    vouchers: vouchers,
    files: files,
    imageCount: imageIndex.all.length,
    checkedAt: new Date().toISOString(),
  };
}

function listDriveFolderFiles(folderId) {
  const folder = DriveApp.getFolderById(folderId);
  const iterator = folder.getFiles();
  const files = [];
  while (iterator.hasNext()) {
    const file = iterator.next();
    files.push({
      id: file.getId(),
      name: file.getName(),
      mimeType: file.getMimeType(),
      url: file.getUrl(),
    });
  }
  return files.sort(function (a, b) {
    return a.name.localeCompare(b.name);
  });
}

function buildDriveImageIndex(folderId) {
  const files = listDriveFolderFiles(folderId);
  const byName = {};
  const byInvoice = {};

  files.forEach(function (file) {
    const normalizedName = normalizeAdminKey(file.name);
    byName[normalizedName] = file;
    extractInvoiceNumbers(file.name).forEach(function (number) {
      byInvoice[number] = file;
    });
  });

  return { all: files, byName: byName, byInvoice: byInvoice };
}

function readVoucherRowsFromDriveFile(file) {
  if (file.mimeType === MimeType.GOOGLE_SHEETS) {
    return readVoucherRowsFromSpreadsheet(file.id);
  }

  if (/\.csv$/i.test(file.name) || file.mimeType === MimeType.CSV) {
    const csvRows = Utilities.parseCsv(DriveApp.getFileById(file.id).getBlob().getDataAsString("UTF-8"));
    return readAdminVoucherRowsFromMatrix(csvRows);
  }

  const spreadsheetMime = "application/vnd.google-apps.spreadsheet";
  const copied = Drive.Files.copy({ title: "tmp-admin-voucher-" + Date.now(), mimeType: spreadsheetMime }, file.id);
  try {
    return readVoucherRowsFromSpreadsheet(copied.id);
  } finally {
    try {
      DriveApp.getFileById(copied.id).setTrashed(true);
    } catch (error) {
      // Temp spreadsheet cleanup is best-effort only.
    }
  }
}

function readVoucherRowsFromSpreadsheet(spreadsheetId) {
  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  const output = [];
  spreadsheet.getSheets().forEach(function (sheet) {
    const values = sheet.getDataRange().getValues();
    readAdminVoucherRowsFromMatrix(values).forEach(function (row) {
      output.push({
        values: row.values,
        sourceRow: row.sourceRow,
        sourceSheet: sheet.getName(),
      });
    });
  });
  return output;
}

function readAdminVoucherRowsFromMatrix(matrix) {
  const headerIndex = matrix.findIndex(function (row) {
    const headers = row.map(normalizeAdminHeader);
    const hasVoucherSignal = ["發票日期", "發票號碼", "供應商名稱", "新檔名"].some(function (name) {
      return headers.indexOf(normalizeAdminHeader(name)) >= 0;
    });
    const hasAmount = ["含稅價", "支出金額", "未稅總價", "稅金"].some(function (name) {
      return headers.indexOf(normalizeAdminHeader(name)) >= 0;
    });
    return hasVoucherSignal && hasAmount;
  });

  if (headerIndex < 0) return [];

  const headers = matrix[headerIndex].map(function (value) { return String(value || "").trim(); });
  return matrix.slice(headerIndex + 1).map(function (row, rowOffset) {
    const values = {};
    headers.forEach(function (header, index) {
      if (header) values[header] = row[index];
    });
    return { values: values, sourceRow: headerIndex + rowOffset + 2 };
  });
}

function parseAdminVoucherRow(row, sourceRow, sourceWorkbook, imageIndex, payload) {
  const invoiceNumber = normalizeAdminInvoiceNumber(pickAdminValue(row, ["發票號碼", "憑證號碼"]));
  const date = normalizeAdminDate(pickAdminValue(row, ["發票日期", "日期"]));
  const counterparty = String(pickAdminValue(row, ["供應商名稱", "供應商", "交易對象", "廠商"]) || "").trim();
  const item = String(pickAdminValue(row, ["品項", "項目", "摘要"]) || "").trim();
  const quantity = parseAdminAmount(pickAdminValue(row, ["數量"]));
  const unitPrice = parseAdminAmount(pickAdminValue(row, ["單價"]));
  const netAmount = parseAdminAmount(pickAdminValue(row, ["未稅總價", "未稅金額"]));
  const taxAmount = parseAdminAmount(pickAdminValue(row, ["稅金", "稅額"]));
  const grossAmount = parseAdminAmount(pickAdminValue(row, ["含稅價", "含稅金額", "總金額"]));
  const expenseAmount = parseAdminAmount(pickAdminValue(row, ["支出金額", "金額"]));
  const amount = grossAmount || expenseAmount || netAmount + taxAmount || netAmount;
  const sourceFileName = String(pickAdminValue(row, ["新檔名", "檔名", "憑證檔名"]) || "").trim();
  const voucherType = String(pickAdminValue(row, ["發票型式", "憑證型式"]) || "").trim();
  const processResult = String(pickAdminValue(row, ["處理結果"]) || "").trim();
  const rawNote = String(pickAdminValue(row, ["備註"]) || "").trim();

  if (!amount || (!invoiceNumber && !sourceFileName && !counterparty && !item)) return null;

  const imageFile = findAdminVoucherImage(imageIndex, sourceFileName, invoiceNumber);
  const voucherLinks = imageFile ? [imageFile.url] : [];
  return {
    invoiceNumber: invoiceNumber,
    date: date || Utilities.formatDate(new Date(), "Asia/Taipei", "yyyy-MM-dd"),
    counterparty: counterparty,
    item: item,
    quantity: quantity,
    unitPrice: unitPrice,
    netAmount: netAmount,
    taxAmount: taxAmount,
    totalAmount: amount,
    matchedAmount: 0,
    remainingAmount: amount,
    voucherLinks: voucherLinks,
    sourceFileName: sourceFileName,
    sourceWorkbook: sourceWorkbook,
    sourceRow: sourceRow,
    voucherType: voucherType,
    processResult: processResult,
    note: [item, processResult, rawNote, sourceFileName ? "檔名：" + sourceFileName : "", "來源：" + sourceWorkbook + " 第 " + sourceRow + " 列"].filter(Boolean).join("｜"),
    matches: [],
    status: "unmatched",
    source: "admin-drive",
    createdBy: payload.userEmail || "Drive Sync",
    userId: payload.userId || "",
  };
}

function findAdminVoucherImage(imageIndex, sourceFileName, invoiceNumber) {
  if (invoiceNumber && imageIndex.byInvoice[invoiceNumber]) return imageIndex.byInvoice[invoiceNumber];
  if (sourceFileName) {
    const normalized = normalizeAdminKey(sourceFileName);
    if (imageIndex.byName[normalized]) return imageIndex.byName[normalized];
    const withoutExt = normalized.replace(/\.[^.]+$/, "");
    const found = imageIndex.all.find(function (file) {
      const fileKey = normalizeAdminKey(file.name);
      return fileKey === normalized || fileKey.replace(/\.[^.]+$/, "") === withoutExt;
    });
    if (found) return found;
  }
  return null;
}

function pickAdminValue(row, names) {
  const entries = Object.keys(row).map(function (key) { return [key, row[key]]; });
  for (var i = 0; i < names.length; i += 1) {
    const target = normalizeAdminHeader(names[i]);
    const found = entries.find(function (entry) {
      return normalizeAdminHeader(entry[0]) === target;
    });
    if (found) return found[1];
  }
  return "";
}

function normalizeAdminHeader(value) {
  return String(value || "").replace(/[\s*＊:：]/g, "").toLowerCase();
}

function normalizeAdminKey(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, "");
}

function normalizeAdminInvoiceNumber(value) {
  return String(value || "").trim().toUpperCase().replace(/[\s-]/g, "");
}

function normalizeAdminDate(value) {
  if (!value) return "";
  if (Object.prototype.toString.call(value) === "[object Date]" && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, "Asia/Taipei", "yyyy-MM-dd");
  }
  const text = String(value).trim();
  const slash = text.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  if (slash) return slash[1] + "-" + String(slash[2]).padStart(2, "0") + "-" + String(slash[3]).padStart(2, "0");
  const compact = text.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (compact) return compact[1] + "-" + compact[2] + "-" + compact[3];
  return "";
}

function parseAdminAmount(value) {
  const amount = Number(String(value || "").replace(/[^\d.-]/g, ""));
  return isFinite(amount) ? Math.abs(amount) : 0;
}

function scanInvoiceNumbersFromPayload(payload) {
  if (payload.secret !== CONFIG.sharedSecret) {
    return { ok: false, error: "secret is invalid" };
  }

  const files = Array.isArray(payload.files) ? payload.files : [];
  const scannedFiles = files.map(function (file) {
    const fileId = file.id || extractDriveFileId(file.url || file.webViewLink || "");
    const name = file.name || file.originalName || fileId || "voucher";
    try {
      if (!fileId) throw new Error("找不到 Google Drive 檔案 ID");
      const text = extractTextFromDriveFile(fileId, name);
      return {
        id: fileId,
        name: name,
        invoiceNumbers: extractInvoiceNumbers(text),
      };
    } catch (error) {
      return {
        id: fileId,
        name: name,
        invoiceNumbers: [],
        error: String(error && error.message ? error.message : error),
      };
    }
  });

  const invoiceNumbers = [];
  scannedFiles.forEach(function (file) {
    (file.invoiceNumbers || []).forEach(function (number) {
      if (invoiceNumbers.indexOf(number) < 0) invoiceNumbers.push(number);
    });
  });

  return {
    ok: true,
    invoiceNumbers: invoiceNumbers,
    candidates: invoiceNumbers,
    files: scannedFiles,
  };
}

function extractTextFromDriveFile(fileId, fallbackName) {
  if (typeof Drive === "undefined" || !Drive.Files) {
    throw new Error("請先在 Apps Script 左側「服務」啟用 Drive API，才能掃描已上傳憑證");
  }

  const sourceFile = DriveApp.getFileById(fileId);
  const blob = sourceFile.getBlob();
  const tempName = "ocr-" + sanitizeFileName(fallbackName || sourceFile.getName()) + "-" + Date.now();
  const tempDoc = Drive.Files.insert(
    {
      title: tempName,
    },
    blob,
    {
      convert: true,
      ocr: true,
      ocrLanguage: "zh-TW",
    }
  );

  try {
    const doc = DocumentApp.openById(tempDoc.id);
    return doc.getBody().getText();
  } finally {
    try {
      DriveApp.getFileById(tempDoc.id).setTrashed(true);
    } catch (error) {
      // OCR temp file cleanup is best-effort only.
    }
  }
}

function extractDriveFileId(url) {
  const value = String(url || "");
  const filePathMatch = value.match(/\/file\/d\/([^/?#]+)/);
  if (filePathMatch) return filePathMatch[1];
  const queryMatch = value.match(/[?&]id=([^&#]+)/);
  if (queryMatch) return queryMatch[1];
  return "";
}

function extractInvoiceNumbers(text) {
  const normalizedText = String(text || "").toUpperCase();
  const matches = normalizedText.match(/[A-Z]{2}[\s-]*\d[\d\s-]{7,}/g) || [];
  const unique = [];
  matches.forEach(function (value) {
    const normalized = value.replace(/[\s-]/g, "");
    if (/^[A-Z]{2}\d{8}$/.test(normalized) && unique.indexOf(normalized) < 0) {
      unique.push(normalized);
    }
  });
  return unique;
}

function jsonpOrJsonOutput(data, callback) {
  if (callback) {
    return ContentService
      .createTextOutput(String(callback) + "(" + JSON.stringify(data) + ");")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return jsonOutput(data);
}

function jsonOutput(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
