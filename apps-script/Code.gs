const CONFIG = {
  projectId: "longbroerp",
  databaseId: "(default)",
  rootFolderName: "\u9686\u535aERP\u6191\u8b49",
  sharedSecret: "74185296",
};

function doGet() {
  return jsonOutput({
    ok: true,
    service: "longbro-erp-line-backend",
    message: "LINE backend is ready.",
    checkedAt: new Date().toISOString(),
  });
}

function doPost(event) {
  try {
    const payload = parsePayload(event);
    if (payload.secret !== CONFIG.sharedSecret) {
      return jsonOutput({ ok: false, error: "secret is invalid" });
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

function jsonOutput(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
