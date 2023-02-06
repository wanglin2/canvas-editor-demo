class CanvasEditor {
  constructor(container, data, options = {}) {
    this.container = container // 容器元素
    this.data = data // 数据
    this.options = Object.assign(
      {
        pageWidth: 794, // 纸张宽度
        pageHeight: 1123, // 纸张高度
        pagePadding: [100, 120, 100, 120], // 纸张内边距，分别为：上、右、下、左
        pagePaddingIndicatorSize: 35 // 纸张内边距指示器的大小，也就是四个直角的边长
      },
      options
    )
  }
}

export default CanvasEditor
