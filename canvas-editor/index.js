class CanvasEditor {
  constructor(container, data, options = {}) {
    this.container = container // 容器元素
    this.data = data // 数据
    this.options = Object.assign(
      {
        pageWidth: 794, // 纸张宽度
        pageHeight: 1123, // 纸张高度
        pagePadding: [100, 120, 100, 120], // 纸张内边距，分别为：上、右、下、左
        pageMargin: 20, // 页面之间的间隔
        pagePaddingIndicatorSize: 35, // 纸张内边距指示器的大小，也就是四个直角的边长
        pagePaddingIndicatorColor: '#BABABA', // 纸张内边距指示器的颜色，也就是四个直角的边颜色
        color: '#333', // 文字颜色
        fontSize: 16, // 字号
        fontFamily: 'Yahei', // 字体
        lineHeight: 1.5 // 行高，倍数
      },
      options
    )
    this.pageCanvasList = [] // 页面canvas列表
    this.pageCanvasCtxList = [] // 页面canvas绘图上下文列表
    this.rows = [] // 渲染的行数据

    this.createPage()
    this.render()
  }

  // 渲染
  render() {
    this.computeRows()
    this.renderPage()
  }

  // 清除渲染
  clear() {
    let { pageWidth, pageHeight } = this.options
    this.pageCanvasCtxList.forEach(item => {
      item.clearRect(0, 0, pageWidth, pageHeight)
    })
  }

  // 渲染页面
  renderPage() {
    let { pageHeight, pagePadding } = this.options
    // 页面内容实际可用高度
    let contentHeight = pageHeight - pagePadding[0] - pagePadding[2]
    // 从第一页开始绘制
    let pageIndex = 0
    let ctx = this.pageCanvasCtxList[pageIndex]
    // 当前页绘制到的高度
    let renderHeight = 0
    // 绘制四个角
    this.renderPagePaddingIndicators(pageIndex)
    this.rows.forEach(row => {
      if (renderHeight + row.height > contentHeight) {
        // 当前页绘制不下，需要创建下一页
        pageIndex++
        // 下一页没有创建则先创建
        let page = this.pageCanvasList[pageIndex]
        if (!page) {
          this.createPage()
        }
        this.renderPagePaddingIndicators(pageIndex)
        ctx = this.pageCanvasCtxList[pageIndex]
        renderHeight = 0
      }
      // 绘制当前行
      this.renderRow(ctx, renderHeight, row)
      // 更新当前页绘制到的高度
      renderHeight += row.height
    })
  }

  // 渲染页面中的一行
  renderRow(ctx, renderHeight, row) {
    let { color, pagePadding } = this.options
    // 内边距
    let offsetX = pagePadding[3]
    let offsetY = pagePadding[0]
    // 当前行绘制到的宽度
    let renderWidth = offsetX
    renderHeight += offsetY
    row.elementList.forEach(item => {
      // 跳过换行符
      if (item.value === '\n') {
        return
      }
      ctx.save()
      // 渲染背景
      if (item.background) {
        ctx.save()
        ctx.beginPath()
        ctx.fillStyle = item.background
        ctx.fillRect(renderWidth, renderHeight, item.info.width, row.height)
        ctx.restore()
      }
      // 渲染下划线
      if (item.underline) {
        ctx.save()
        ctx.beginPath()
        ctx.moveTo(renderWidth, renderHeight + row.height)
        ctx.lineTo(renderWidth + item.info.width, renderHeight + row.height)
        ctx.stroke()
        ctx.restore()
      }
      // 渲染删除线
      if (item.linethrough) {
        ctx.save()
        ctx.beginPath()
        ctx.moveTo(renderWidth, renderHeight + row.height / 2)
        ctx.lineTo(renderWidth + item.info.width, renderHeight + row.height / 2)
        ctx.stroke()
        ctx.restore()
      }
      // 渲染文字
      ctx.font = item.font
      ctx.fillStyle = item.color || color
      ctx.fillText(
        item.value,
        renderWidth,
        renderHeight + row.height - (row.height - row.originHeight) / 2
      )
      // 更新当前行绘制到的宽度
      renderWidth += item.info.width
      // 辅助线
      // ctx.moveTo(pagePadding[3], renderHeight)
      // ctx.lineTo(673, renderHeight)
      // ctx.stroke()
      ctx.restore()
    })
  }

  // 计算行渲染数据
  computeRows() {
    let { pageWidth, pagePadding, lineHeight } = this.options
    // 实际内容可用宽度
    let contentWidth = pageWidth - pagePadding[1] - pagePadding[3]
    // 创建一个临时canvas用来测量文本宽高
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    // 行数据
    let rows = []
    rows.push({
      width: 0,
      height: 0,
      originHeight: 0, // 没有应用行高的原始高度
      elementList: []
    })
    this.data.forEach(item => {
      let { value, lineheight } = item
      // 实际行高倍数
      let actLineHeight = lineheight || lineHeight
      // 获取文本宽高
      let font = this.getFontStr(item)
      ctx.font = font
      let { width, actualBoundingBoxAscent, actualBoundingBoxDescent } =
        ctx.measureText(value)
      // 尺寸信息
      let info = {
        width,
        height: actualBoundingBoxAscent + actualBoundingBoxDescent,
        ascent: actualBoundingBoxAscent,
        descent: actualBoundingBoxDescent
      }
      // 完整数据
      let element = {
        ...item,
        info,
        font
      }
      // 判断当前行是否能容纳
      let curRow = rows[rows.length - 1]
      if (curRow.width + info.width <= contentWidth && value !== '\n') {
        curRow.elementList.push(element)
        curRow.width += info.width
        curRow.height = Math.max(curRow.height, info.height * actLineHeight) // 保存当前行实际最高的文本高度
        curRow.originHeight = Math.max(curRow.originHeight, info.height) // 保存当前行原始最高的文本高度
      } else {
        rows.push({
          width: info.width,
          height: info.height * actLineHeight,
          originHeight: info.height,
          elementList: [element]
        })
      }
    })
    console.log(rows)
    this.rows = rows
  }

  // 拼接font字符串
  getFontStr(element) {
    let { fontSize, fontFamily } = this.options
    return `${element.italic ? 'italic ' : ''} ${element.bold ? 'bold ' : ''} ${
      element.size || fontSize
    }px  ${element.fontfamily || fontFamily} `
  }

  // 创建页面
  createPage() {
    let { pageWidth, pageHeight, pageMargin } = this.options
    let canvas = document.createElement('canvas')
    canvas.width = pageWidth
    canvas.height = pageHeight
    canvas.style.cursor = 'text'
    canvas.style.backgroundColor = '#fff'
    canvas.style.boxShadow = '#9ea1a566 0 2px 12px'
    canvas.style.marginBottom = pageMargin + 'px'
    this.container.appendChild(canvas)
    let ctx = canvas.getContext('2d')
    this.pageCanvasList.push(canvas)
    this.pageCanvasCtxList.push(ctx)
  }

  // 绘制页面四个直角指示器
  renderPagePaddingIndicators(pageNo) {
    let ctx = this.pageCanvasCtxList[pageNo]
    if (!ctx) {
      return
    }
    let {
      pageWidth,
      pageHeight,
      pagePaddingIndicatorColor,
      pagePadding,
      pagePaddingIndicatorSize
    } = this.options
    ctx.save()
    ctx.strokeStyle = pagePaddingIndicatorColor
    let list = [
      // 左上
      [
        [pagePadding[3], pagePadding[0] - pagePaddingIndicatorSize],
        [pagePadding[3], pagePadding[0]],
        [pagePadding[3] - pagePaddingIndicatorSize, pagePadding[0]]
      ],
      // 右上
      [
        [pageWidth - pagePadding[1], pagePadding[0] - pagePaddingIndicatorSize],
        [pageWidth - pagePadding[1], pagePadding[0]],
        [pageWidth - pagePadding[1] + pagePaddingIndicatorSize, pagePadding[0]]
      ],
      // 左下
      [
        [
          pagePadding[3],
          pageHeight - pagePadding[2] + pagePaddingIndicatorSize
        ],
        [pagePadding[3], pageHeight - pagePadding[2]],
        [pagePadding[3] - pagePaddingIndicatorSize, pageHeight - pagePadding[2]]
      ],
      // 右下
      [
        [
          pageWidth - pagePadding[1],
          pageHeight - pagePadding[2] + pagePaddingIndicatorSize
        ],
        [pageWidth - pagePadding[1], pageHeight - pagePadding[2]],
        [
          pageWidth - pagePadding[1] + pagePaddingIndicatorSize,
          pageHeight - pagePadding[2]
        ]
      ]
    ]
    list.forEach(item => {
      item.forEach((point, index) => {
        if (index === 0) {
          ctx.beginPath()
          ctx.moveTo(...point)
        } else {
          ctx.lineTo(...point)
        }
        if (index >= item.length - 1) {
          ctx.stroke()
        }
      })
    })
    ctx.restore()
  }
}

export default CanvasEditor
