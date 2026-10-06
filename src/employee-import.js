export const employeeFields = [
  ['id', '員工編號', 'text'], ['name', '姓名', 'text'],
  ['role', '身分', 'role'], ['department', '部門', 'text'],
  ['hireDate', '到職日', 'date'], ['baseSalary', '底薪', 'number'],
  ['dutyAllowance', '職務加給', 'number'], ['mealAllowance', '伙食津貼', 'number'],
  ['laborInsuredSalary', '勞保投保薪資', 'number'], ['healthInsuredSalary', '健保投保薪資', 'number'],
  ['healthDependentCount', '健保眷屬人數', 'number'], ['healthDependentStartDate', '眷屬加保日期', 'date'],
];

const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function validateEmployeeRows(rows, existing) {
  const seen = new Set();
  return rows.map((source) => {
    const row = {};
    const errors = [];
    for (const [key, label, type] of employeeFields) {
      const raw = String(source[key] ?? '').trim();
      row[key] = raw;
      if (type === 'number') {
        const value = Number(raw.replace(/,/g, ''));
        if (!raw || !Number.isFinite(value) || value < 0 || !Number.isInteger(value) || value > 999999) errors.push(`${label}須為非負整數`);
        row[key] = value;
      }
      if (type === 'date' && raw) {
        const date = raw.replace(/\//g, '-');
        const match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(date);
        const normalized = match ? `${match[1]}-${match[2].padStart(2,'0')}-${match[3].padStart(2,'0')}` : '';
        const parsed = new Date(`${normalized}T00:00:00Z`);
        if (!normalized || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0,10) !== normalized) errors.push(`${label}格式錯誤`);
        row[key] = normalized;
      }
    }
    if (!row.id || !row.name || !row.hireDate || !row.department) errors.push('編號、姓名、部門、到職日必填');
    if (!['員工', '雇主'].includes(row.role)) errors.push('身分須為員工或雇主');
    if (row.healthDependentCount > 3) errors.push('眷屬人數須為 0 至 3');
    if (row.healthDependentCount > 0 && !row.healthDependentStartDate) errors.push('請填眷屬加保日期');
    if (seen.has(row.id)) errors.push('檔案內員工編號重複');
    seen.add(row.id);
    return {row, errors, exists: existing.some((item) => item.id === row.id)};
  });
}

export function bindEmployeeImport({ getRows, saveRows, canEdit, toast }) {
  const dialog = document.createElement('dialog');
  dialog.className = 'employee-import-dialog';
  document.body.append(dialog);
  dialog.addEventListener('cancel', (event) => event.preventDefault());
  let busy = false;
  let candidates = [];
  const close = () => { if (!busy) dialog.close(); };
  function preview(rows) {
    candidates = validateEmployeeRows(rows, getRows());
    dialog.innerHTML = `<h2>確認員工資料</h2><div class="employee-import-scroll"><table><thead><tr>${employeeFields.map(([,label]) => `<th>${label}</th>`).join('')}<th>檢查結果</th></tr></thead><tbody>${candidates.map(({row,errors,exists}) => `<tr>${employeeFields.map(([key]) => `<td>${escape(row[key])}</td>`).join('')}<td>${escape(errors.join('；') || (exists ? '既有員工' : '新增'))}</td></tr>`).join('')}</tbody></table></div><p><label><input id="employeeAllowUpdate" type="checkbox"> 更新同編號的既有員工</label></p><p id="employeeImportStatus" role="status"></p><footer><button type="button" data-cancel>取消</button><button type="button" data-back>返回修改</button><button type="button" data-save>確認儲存並同步</button></footer>`;
    dialog.querySelector('[data-cancel]').onclick = close;
    dialog.querySelector('[data-back]').onclick = () => edit(rows);
    dialog.querySelector('[data-save]').onclick = async () => {
      if (!canEdit() || busy) return;
      const status = dialog.querySelector('#employeeImportStatus');
      if (candidates.some((item) => item.errors.length)) { status.textContent = '請返回修正錯誤後再儲存。'; return; }
      if (candidates.some((item) => item.exists) && !dialog.querySelector('#employeeAllowUpdate').checked) { status.textContent = '含既有員工，請確認是否更新。'; return; }
      busy = true;
      dialog.querySelectorAll('button,input').forEach((el) => { el.disabled = true; });
      status.textContent = '正在儲存並同步…';
      try {
        await saveRows(candidates.map((item) => item.row));
        busy = false;
        dialog.close();
        toast(`已儲存並同步 ${candidates.length} 位員工。`);
      } catch (error) {
        status.textContent = `同步未完成：${error.message}。資料仍保留在此視窗，可重試。`;
      } finally {
        busy = false;
        dialog.querySelectorAll('button,input').forEach((el) => { el.disabled = false; });
      }
    };
    if (!dialog.open) dialog.showModal();
  }
  function edit(rows) {
    dialog.innerHTML = `<h2>員工資料</h2><form><div class="employee-import-scroll">${rows.map((row,index) => `<fieldset><legend>第 ${index + 1} 位員工</legend><div class="employee-import-fields">${employeeFields.map(([key,label,type]) => `<label>${label}${type === 'role' ? `<select data-index="${index}" data-field="${key}"><option${row[key] === '員工' ? ' selected' : ''}>員工</option><option${row[key] === '雇主' ? ' selected' : ''}>雇主</option></select>` : `<input data-index="${index}" data-field="${key}" type="${type}" ${type === 'number' ? 'min="0" step="1"' : ''} value="${escape(row[key])}">`}</label>`).join('')}</div></fieldset>`).join('')}</div><footer><button type="button" data-cancel>取消</button><button type="submit">預覽資料</button></footer></form>`;
    dialog.querySelector('[data-cancel]').onclick = close;
    dialog.querySelector('form').onsubmit = (event) => {
      event.preventDefault();
      const edited = rows.map(() => ({}));
      dialog.querySelectorAll('[data-field]').forEach((input) => { edited[Number(input.dataset.index)][input.dataset.field] = input.value; });
      preview(edited);
    };
    if (!dialog.open) dialog.showModal();
  }
  document.querySelector('#addPayrollEmployeeButton').onclick = () => {
    if (canEdit()) edit([{role:'員工', department:'營運', baseSalary:0, dutyAllowance:0, mealAllowance:3000, laborInsuredSalary:0, healthInsuredSalary:0, healthDependentCount:0}]);
  };
  const fileInput = document.querySelector('#importPayrollEmployeesInput');
  document.querySelector('#importPayrollEmployeesButton').onclick = () => { if (canEdit()) fileInput.click(); };
  fileInput.onchange = async () => {
    const file = fileInput.files[0];
    fileInput.value = '';
    if (!file || !canEdit()) return;
    try {
      if (!window.XLSX) throw new Error('Excel 匯入工具尚未載入，請重新整理');
      const workbook = window.XLSX.read(await file.arrayBuffer(), {type:'array', cellDates:true});
      const source = window.XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], {defval:''});
      if (!source.length || source.length > 200) throw new Error('每次請匯入 1 至 200 位員工');
      const required = employeeFields.filter(([key]) => key !== 'healthDependentStartDate');
      if (required.some(([,label]) => !Object.hasOwn(source[0], label))) throw new Error('欄位不完整，請使用匯入範本');
      preview(source.map((item) => Object.fromEntries(employeeFields.map(([key,label]) => {
        const value = item[label];
        return [key, value instanceof Date ? `${value.getFullYear()}-${String(value.getMonth()+1).padStart(2,'0')}-${String(value.getDate()).padStart(2,'0')}` : value];
      }))));
    } catch (error) { toast(`匯入失敗：${error.message}`); }
  };
  document.querySelector('#downloadEmployeeTemplateButton').onclick = () => {
    const workbook = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(workbook, window.XLSX.utils.aoa_to_sheet([employeeFields.map(([,label]) => label)]), '員工資料');
    window.XLSX.writeFile(workbook, '員工匯入範本.xlsx');
  };
}
