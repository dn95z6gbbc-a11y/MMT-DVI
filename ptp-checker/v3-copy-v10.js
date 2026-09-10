const vcheckCopyFrame=document.getElementById('app');
vcheckCopyFrame.addEventListener('load',()=>{
  const d=vcheckCopyFrame.contentDocument;
  const privacy=d?.querySelector('.privacy div');
  if(privacy)privacy.innerHTML='<b>Проверка идёт в два слоя.</b><br>Формальные параметры проверяются автоматически. Текстовые материалы читает YandexGPT. Подкасты сначала расшифровывает SpeechKit, затем YandexGPT анализирует содержание по требованиям выбранного формата. Итоговое решение остаётся за преподавателем.';
  const aiBox=d?.querySelector('.ai-box');
  if(aiBox)aiBox.innerHTML='<b>Одна кнопка — две проверки</b>Формальные требования проверяются автоматически. Текстовые материалы читает YandexGPT. Подкасты V-CHECK временно загружает для расшифровки через SpeechKit, после чего YandexGPT анализирует расшифровку. Видео пока проходят формальную проверку. Максимум файла — 100 МБ, максимум — 2 проверки в сутки.';
});