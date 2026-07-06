/**
 * 简单的Toast通知系统
 */

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
  duration?: number;
}

/**
 * 显示一个toast通知
 */
export function toast(options: ToastOptions) {
  // 创建toast元素
  const toastElement = document.createElement('div');
  
  // 设置样式
  toastElement.className = `fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md rounded-md border p-4 shadow-md transition-all`;
  
  // 根据变体设置不同的样式
  switch(options.variant) {
    case 'destructive':
      toastElement.className += ' border-red-200 bg-red-50 text-red-900';
      break;
    case 'success':
      toastElement.className += ' border-green-200 bg-green-50 text-green-900';
      break;
    default:
      toastElement.className += ' border-gray-200 bg-white text-gray-900';
  }
  
  // 创建内容
  const contentDiv = document.createElement('div');
  contentDiv.className = 'flex justify-between items-start';
  
  const textDiv = document.createElement('div');
  
  if (options.title) {
    const titleElement = document.createElement('h3');
    titleElement.className = 'font-medium mb-1';
    titleElement.textContent = options.title;
    textDiv.appendChild(titleElement);
  }
  
  if (options.description) {
    const descriptionElement = document.createElement('p');
    descriptionElement.className = 'text-sm';
    descriptionElement.textContent = options.description;
    textDiv.appendChild(descriptionElement);
  }
  
  contentDiv.appendChild(textDiv);
  
  // 添加关闭按钮
  const closeButton = document.createElement('button');
  closeButton.className = 'rounded-full p-1 hover:bg-gray-100';
  closeButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  `;
  closeButton.onclick = () => {
    document.body.removeChild(toastElement);
  };
  
  contentDiv.appendChild(closeButton);
  toastElement.appendChild(contentDiv);
  
  // 添加到body
  document.body.appendChild(toastElement);
  
  // 设置自动关闭
  const duration = options.duration || 3000;
  setTimeout(() => {
    // 检查元素是否仍然存在
    if (document.body.contains(toastElement)) {
      toastElement.style.opacity = '0';
      setTimeout(() => {
        if (document.body.contains(toastElement)) {
          document.body.removeChild(toastElement);
        }
      }, 300);
    }
  }, duration);
  
  // 添加淡入效果
  toastElement.style.opacity = '0';
  setTimeout(() => {
    toastElement.style.opacity = '1';
    toastElement.style.transition = 'opacity 0.3s ease-in-out';
  }, 10);
}
