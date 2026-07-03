const CONFIG = {
  projectId: "longbroerp",
  databaseId: "(default)",
  rootFolderName: "\u9686\u535aERP\u6191\u8b49",
  adminVoucherListFolderId: "1POTpxGEPNQB3xDp4gkzjPQ-nYLuQAFsZ",
  adminVoucherImageFolderId: "1oCzWPjoL5lIwaJJxpnAx_hQ0x2m5yHfI",
  fixedAssetSpreadsheetId: "1SEqDeO6_yXkRwva0h4PldoeBI7divMWCQE8KQQ3E3kE",
  fixedAssetSheetName: "\u8cc7\u7522\u6e05\u518a",
  sharedSecret: "CHANGE_ME_SHARED_SECRET",
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

    if (payload.action === "syncFixedAsset") {
      return jsonOutput(syncFixedAssetToSheet(payload));
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

function syncFixedAssetToSheet(payload) {
  if (payload.secret !== CONFIG.sharedSecret) {
    return { ok: false, error: "secret is invalid" };
  }

  const asset = payload.asset || {};
  const spreadsheetId = payload.spreadsheetId || CONFIG.fixedAssetSpreadsheetId;
  const sheetName = payload.sheetName || CONFIG.fixedAssetSheetName;
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) throw new Error("asset sheet not found: " + sheetName);

    const headerRow = findFixedAssetHeaderRow(sheet);
    const headers = sheet.getRange(headerRow, 1, 1, Math.max(sheet.getLastColumn(), 12)).getValues()[0];
    const normalizedHeaders = headers.map(normalizeFixedAssetHeader);
    const numberColumn = normalizedHeaders.indexOf(normalizeFixedAssetHeader("\u8cc7\u7522\u7de8\u865f")) + 1;
    if (!numberColumn) throw new Error("asset number column not found");

    const rowValues = buildFixedAssetSheetRow(asset);
    const targetRow = findFixedAssetTargetRow(sheet, headerRow, numberColumn, asset.assetNumber);
    const action = targetRow > sheet.getLastRow() ? "append" : "update";
    sheet.getRange(targetRow, 1, 1, rowValues.length).setValues([rowValues]);

    return {
      ok: true,
      action: action,
      assetNumber: asset.assetNumber || "",
      row: targetRow,
      checkedAt: new Date().toISOString(),
    };
  } finally {
    lock.releaseLock();
  }
}

function findFixedAssetHeaderRow(sheet) {
  const maxRows = Math.min(sheet.getLastRow(), 20);
  const values = sheet.getRange(1, 1, maxRows, Math.max(sheet.getLastColumn(), 12)).getValues();
  for (var rowIndex = 0; rowIndex < values.length; rowIndex += 1) {
    const headers = values[rowIndex].map(normalizeFixedAssetHeader);
    if (headers.indexOf(normalizeFixedAssetHeader("\u8cc7\u7522\u7de8\u865f")) >= 0 && headers.indexOf(normalizeFixedAssetHeader("\u540d\u7a31")) >= 0) {
      return rowIndex + 1;
    }
  }
  throw new Error("asset header row not found");
}

function findFixedAssetTargetRow(sheet, headerRow, numberColumn, assetNumber) {
  const lastRow = sheet.getLastRow();
  const normalizedNumber = String(assetNumber || "").trim();
  if (normalizedNumber && lastRow > headerRow) {
    const numbers = sheet.getRange(headerRow + 1, numberColumn, lastRow - headerRow, 1).getValues();
    for (var index = 0; index < numbers.length; index += 1) {
      if (String(numbers[index][0] || "").trim() === normalizedNumber) {
        return headerRow + 1 + index;
      }
    }
  }
  return lastRow + 1;
}

function buildFixedAssetSheetRow(asset) {
  const warrantyMonths = asset.warrantyMonths === "" || asset.warrantyMonths === null || asset.warrantyMonths === undefined
    ? ""
    : Number(asset.warrantyMonths || 0);
  return [
    asset.assetNumber || "",
    asset.category || "",
    asset.name || "",
    Number(asset.quantity || 0),
    normalizeSheetDate(asset.purchaseDate),
    Number(asset.amount || 0),
    warrantyMonths,
    normalizeSheetDate(asset.warrantyEndDate),
    asset.warrantyStatus || "",
    asset.labelStatus || "\u672a\u8cbc",
    asset.note || "",
    asset.pendingReason || "",
  ];
}

function normalizeSheetDate(value) {
  if (!value) return "";
  if (value instanceof Date) return value;
  const date = new Date(String(value) + "T00:00:00");
  return Number.isNaN(date.getTime()) ? String(value) : date;
}

function normalizeFixedAssetHeader(value) {
  return String(value || "").replace(/\s+/g, "").toLowerCase();
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
        const sourceWorkbook = row.sourceSheet ? file.name + " / " + row.sourceSheet : file.name;
        const voucher = parseAdminVoucherRow(row.values, row.sourceRow, sourceWorkbook, imageIndex, payload);
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
    const hasVoucherSignal = ["\u767c\u7968\u65e5\u671f", "\u55ae\u64da\u65e5\u671f", "\u767c\u7968\u865f\u78bc", "\u539f\u767c\u7968\u865f\u78bc", "\u6298\u8b93\u55ae\u865f / \u9000\u8ca8\u55ae\u865f", "\u55ae\u64da\u985e\u578b", "\u4f9b\u61c9\u5546\u540d\u7a31", "\u65b0\u6a94\u540d"].some(function (name) {
      return headers.indexOf(normalizeAdminHeader(name)) >= 0;
    });
    const hasAmount = ["\u542b\u7a05\u50f9", "\u542b\u7a05\u91d1\u984d", "\u652f\u51fa\u91d1\u984d", "\u672a\u7a05\u7e3d\u50f9", "\u672a\u7a05\u91d1\u984d", "\u7a05\u91d1"].some(function (name) {
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
  const invoiceNumber = normalizeAdminInvoiceNumber(pickAdminValue(row, ["\u767c\u7968\u865f\u78bc", "\u6191\u8b49\u865f\u78bc"]));
  const originalInvoiceNumber = normalizeAdminInvoiceNumber(pickAdminValue(row, ["\u539f\u767c\u7968\u865f\u78bc", "\u539f\u6191\u8b49\u865f\u78bc"]));
  const adjustmentNumber = String(pickAdminValue(row, ["\u6298\u8b93\u55ae\u865f / \u9000\u8ca8\u55ae\u865f", "\u6298\u8b93\u55ae\u865f", "\u9000\u8ca8\u55ae\u865f", "\u9000\u51fa\u55ae\u865f"]) || "").trim();
  const date = normalizeAdminDate(pickAdminValue(row, ["\u767c\u7968\u65e5\u671f", "\u55ae\u64da\u65e5\u671f", "\u65e5\u671f"]));
  const counterparty = String(pickAdminValue(row, ["\u4f9b\u61c9\u5546\u540d\u7a31", "\u4f9b\u61c9\u5546", "\u4ea4\u6613\u5c0d\u8c61", "\u5ee0\u5546", "\u4ea4\u6613\u5c0d\u8c61\u7cfb\u7d71\u7de8\u78bc"]) || "").trim();
  const item = String(pickAdminValue(row, ["\u54c1\u9805", "\u9805\u76ee", "\u6458\u8981"]) || "").trim();
  const quantity = parseAdminAmount(pickAdminValue(row, ["\u6578\u91cf"]));
  const unitPrice = parseAdminAmount(pickAdminValue(row, ["\u55ae\u50f9"]));
  const netAmount = parseAdminAmount(pickAdminValue(row, ["\u672a\u7a05\u7e3d\u50f9", "\u672a\u7a05\u91d1\u984d"]));
  const taxAmount = parseAdminAmount(pickAdminValue(row, ["\u7a05\u91d1", "\u7a05\u984d"]));
  const grossAmount = parseAdminAmount(pickAdminValue(row, ["\u542b\u7a05\u50f9", "\u542b\u7a05\u91d1\u984d", "\u7e3d\u91d1\u984d"]));
  const expenseAmount = parseAdminAmount(pickAdminValue(row, ["\u652f\u51fa\u91d1\u984d", "\u91d1\u984d"]));
  const amount = grossAmount || expenseAmount || netAmount + taxAmount || netAmount;
  const sourceFileName = String(pickAdminValue(row, ["\u65b0\u6a94\u540d", "\u6a94\u540d", "\u6191\u8b49\u6a94\u540d"]) || "").trim();
  const voucherType = String(pickAdminValue(row, ["\u55ae\u64da\u985e\u578b", "\u767c\u7968\u578b\u5f0f", "\u6191\u8b49\u578b\u5f0f"]) || "").trim();
  const processResult = String(pickAdminValue(row, ["\u8655\u7406\u7d50\u679c"]) || "").trim();
  const rawNote = String(pickAdminValue(row, ["\u5099\u8a3b"]) || "").trim();
  const documentMeta = resolveAdminVoucherDocumentMeta([voucherType, processResult, sourceWorkbook, sourceFileName, rawNote].join(" "));

  if (!amount || (!invoiceNumber && !sourceFileName && !counterparty && !item)) return null;

  const imageFile = findAdminVoucherImage(imageIndex, sourceFileName, invoiceNumber);
  const voucherLinks = imageFile ? [imageFile.url] : [];
  return {
    invoiceNumber: invoiceNumber,
    originalInvoiceNumber: originalInvoiceNumber,
    adjustmentNumber: adjustmentNumber,
    date: date || Utilities.formatDate(new Date(), "Asia/Taipei", "yyyy-MM-dd"),
    type: documentMeta.recordType || "expense",
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
    voucherType: documentMeta.label || voucherType,
    documentType: documentMeta.documentType,
    adjustmentKind: documentMeta.adjustmentKind,
    processResult: processResult,
    note: [item, documentMeta.label, originalInvoiceNumber ? "Original invoice: " + originalInvoiceNumber : "", adjustmentNumber ? "Adjustment no: " + adjustmentNumber : "", processResult, rawNote, sourceFileName ? "File: " + sourceFileName : "", "Source: " + sourceWorkbook + " row " + sourceRow].filter(Boolean).join(" | "),
    matches: [],
    status: "unmatched",
    source: "admin-drive",
    createdBy: payload.userEmail || "Drive Sync",
    userId: payload.userId || "",
  };
}

function resolveAdminVoucherDocumentMeta(text) {
  const value = String(text || "");
  if (value.indexOf("\u9032\u8ca8\u6298\u8b93") >= 0) {
    return { recordType: "expense", documentType: "purchaseAllowance", adjustmentKind: "allowance", label: "\u9032\u8ca8\u6298\u8b93\u55ae" };
  }
  if (value.indexOf("\u9032\u8ca8\u9000") >= 0 || value.indexOf("\u9032\u8ca8\u9000\u51fa") >= 0 || value.indexOf("\u9000\u51fa\u55ae") >= 0) {
    return { recordType: "expense", documentType: "purchaseReturn", adjustmentKind: "return", label: "\u9032\u8ca8\u9000\u51fa\u55ae" };
  }
  if (value.indexOf("\u92b7\u8ca8\u6298\u8b93") >= 0) {
    return { recordType: "income", documentType: "salesAllowance", adjustmentKind: "allowance", label: "\u92b7\u8ca8\u6298\u8b93\u55ae" };
  }
  if (value.indexOf("\u92b7\u8ca8\u9000") >= 0 || value.indexOf("\u92b7\u8ca8\u9000\u56de") >= 0 || value.indexOf("\u9000\u56de\u55ae") >= 0) {
    return { recordType: "income", documentType: "salesReturn", adjustmentKind: "return", label: "\u92b7\u8ca8\u9000\u56de\u55ae" };
  }
  return { recordType: "", documentType: "invoice", adjustmentKind: "", label: "" };
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
  return String(value || "").replace(/[\s*:\uFF1A\/\uFF0F]+/g, "").toLowerCase();
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
      if (!fileId) throw new Error("Missing Google Drive file ID");
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
    throw new Error("Drive API is not enabled in Apps Script services");
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
