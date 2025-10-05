document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('import');
  input.addEventListener('change', async () => {
    if (!input.files || input.files.length === 0) {
      console.warn('No file selected');
      return;
    }
    const file = input.files[0];

    const data = await file.text();
    console.log('file content', data);
    browser.runtime.sendMessage({ action: Action.ReturnFileData, data });
    // todo 导入完成给个提示
  });

  const opener = document.getElementById('open-file-input');
  opener.onclick = () => input.click();
});
