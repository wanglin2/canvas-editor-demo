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
    this.positionList = [] // 定位元素列表
    this.cursorPositionIndex = -1 // 当前光标所在元素索引
    this.cursorEl = null // 光标元素
    this.cursorTimer = null // 光标元素闪烁的定时器
    this.textareaEl = null // 文本输入框元素
    this.isCompositing = false // 是否正在输入拼音

    this.createPage(0)
    this.render()
  }

  // 渲染
  render() {
    this.clear()
    this.rows = []
    this.positionList = []
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
    this.rows.forEach((row, index) => {
      if (renderHeight + row.height > contentHeight) {
        // 当前页绘制不下，需要创建下一页
        pageIndex++
        // 下一页没有创建则先创建
        let page = this.pageCanvasList[pageIndex]
        if (!page) {
          this.createPage(pageIndex)
        }
        this.renderPagePaddingIndicators(pageIndex)
        ctx = this.pageCanvasCtxList[pageIndex]
        renderHeight = 0
      }
      // 绘制当前行
      this.renderRow(ctx, renderHeight, row, pageIndex, index)
      // 更新当前页绘制到的高度
      renderHeight += row.height
    })
    console.log(this.positionList)
  }

  // 渲染页面中的一行
  renderRow(ctx, renderHeight, row, pageIndex, rowIndex) {
    let { color, pagePadding } = this.options
    // 内边距
    let offsetX = pagePadding[3]
    let offsetY = pagePadding[0]
    // 当前行绘制到的宽度
    let renderWidth = offsetX
    renderHeight += offsetY
    row.elementList.forEach(item => {
      // 收集positionList
      this.positionList.push({
        ...item,
        pageIndex, // 所在页
        rowIndex, // 所在行
        rect: {
          // 包围框
          leftTop: [renderWidth, renderHeight],
          leftBottom: [renderWidth, renderHeight + row.height],
          rightTop: [renderWidth + item.info.width, renderHeight],
          rightBottom: [
            renderWidth + item.info.width,
            renderHeight + row.height
          ]
        }
      })
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
        renderHeight +
          row.height -
          (row.height - row.originHeight) / 2 -
          row.descent
      )
      // 更新当前行绘制到的宽度
      renderWidth += item.info.width
      ctx.restore()
    })
    // 辅助线
    // ctx.beginPath()
    // ctx.moveTo(pagePadding[3], renderHeight + row.height)
    // ctx.lineTo(673, renderHeight + row.height)
    // ctx.stroke()
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
      descent: 0, // 行内元素最大的descent
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
        curRow.descent = Math.max(curRow.descent, info.descent) // 保存当前行最大的descent
      } else {
        rows.push({
          width: info.width,
          height: info.height * actLineHeight,
          originHeight: info.height,
          elementList: [element],
          descent: info.descent
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
  createPage(pageIndex) {
    let { pageWidth, pageHeight, pageMargin } = this.options
    let canvas = document.createElement('canvas')
    canvas.width = pageWidth
    canvas.height = pageHeight
    canvas.style.cursor = 'text'
    canvas.style.backgroundColor = '#fff'
    canvas.style.boxShadow = '#9ea1a566 0 2px 12px'
    canvas.style.marginBottom = pageMargin + 'px'
    canvas.addEventListener('mousedown', e => {
      this.onMousedown(e, pageIndex)
    })
    this.container.appendChild(canvas)
    let ctx = canvas.getContext('2d')
    this.pageCanvasList.push(canvas)
    this.pageCanvasCtxList.push(ctx)
  }

  // 页面鼠标按下事件
  onMousedown(e, pageIndex) {
    // 鼠标按下位置相对于页面canvas的坐标
    let { x, y } = this.windowToCanvas(e, this.pageCanvasList[pageIndex])
    // 计算该坐标对应的元素索引
    let positionIndex = this.getPositionByPos(x, y, pageIndex)
    this.cursorPositionIndex = positionIndex
    // 计算光标位置及渲染
    this.computeAndRenderCursor(positionIndex, pageIndex)
    // 光标测试辅助线
    // let ctx = this.pageCanvasCtxList[pageIndex]
    // ctx.moveTo(cursorInfo.x, cursorInfo.y)
    // ctx.lineTo(cursorInfo.x, cursorInfo.y + cursorInfo.height)
    // ctx.stroke()
  }

  // 获取某个坐标所在的元素
  getPositionByPos(x, y, pageIndex) {
    // 是否点击在某个元素内
    for (let i = 0; i < this.positionList.length; i++) {
      let cur = this.positionList[i]
      if (cur.pageIndex !== pageIndex) {
        continue
      }
      if (
        x >= cur.rect.leftTop[0] &&
        x <= cur.rect.rightTop[0] &&
        y >= cur.rect.leftTop[1] &&
        y <= cur.rect.leftBottom[1]
      ) {
        // 如果是当前元素的前半部分则点击元素为前一个元素
        if (x < cur.rect.leftTop[0] + cur.info.width / 2) {
          return i - 1
        }
        return i
      }
    }
    // 是否点击在某一行
    let index = -1
    for (let i = 0; i < this.positionList.length; i++) {
      let cur = this.positionList[i]
      if (cur.pageIndex !== pageIndex) {
        continue
      }
      if (y >= cur.rect.leftTop[1] && y <= cur.rect.leftBottom[1]) {
        index = i
      }
    }
    if (index !== -1) {
      return index
    }
    // 返回当前页的最后一个元素
    for (let i = 0; i < this.positionList.length; i++) {
      let cur = this.positionList[i]
      if (cur.pageIndex !== pageIndex) {
        continue
      }
      index = i
    }
    return index
  }

  // 获取光标位置信息
  getCursorInfo(position) {
    let { fontSize } = this.options
    // 光标高度在字号的基础上再高一点
    let height = position.size || fontSize
    let plusHeight = height / 2
    let actHeight = height + plusHeight
    // 元素所在行
    let row = this.rows[position.rowIndex]
    return {
      x: position.rect.rightTop[0],
      y:
        position.rect.rightTop[1] +
        row.height -
        (row.height - row.originHeight) / 2 -
        actHeight +
        (actHeight - Math.max(height, position.info.height)) / 2,
      height: actHeight
    }
  }

  // 计算光标位置及渲染光标
  computeAndRenderCursor(positionIndex, pageIndex) {
    // 根据元素索引计算出光标位置和高度信息
    let cursorInfo = this.getCursorInfo(this.positionList[positionIndex])
    // 渲染光标
    let cursorPos = this.canvasToContainer(
      cursorInfo.x,
      cursorInfo.y,
      this.pageCanvasList[pageIndex]
    )
    this.setCursor(cursorPos.x, cursorPos.y, cursorInfo.height)
  }

  // 设置光标
  setCursor(left, top, height) {
    clearTimeout(this.cursorTimer)
    if (!this.cursorEl) {
      this.cursorEl = document.createElement('div')
      this.cursorEl.style.position = 'absolute'
      this.cursorEl.style.width = '1px'
      this.cursorEl.style.backgroundColor = '#000'
      this.container.appendChild(this.cursorEl)
    }
    this.cursorEl.style.left = left + 'px'
    this.cursorEl.style.top = top + 'px'
    this.cursorEl.style.height = height + 'px'
    this.cursorEl.style.opacity = 1
    this.blinkCursor(0)
    setTimeout(() => {
      this.focus()
    }, 0)
  }

  // 光标闪烁
  blinkCursor(opacity) {
    this.cursorTimer = setTimeout(() => {
      this.cursorEl.style.opacity = opacity
      this.blinkCursor(opacity === 0 ? 1 : 0)
    }, 600)
  }

  // 聚焦
  focus() {
    if (!this.textareaEl) {
      this.textareaEl = document.createElement('textarea')
      this.textareaEl.style.position = 'fixed'
      this.textareaEl.style.left = '-99999px'
      this.textareaEl.addEventListener('input', this.onInput.bind(this))
      this.textareaEl.addEventListener('compositionstart', () => {
        this.isCompositing = true
      })
      this.textareaEl.addEventListener('compositionend', () => {
        this.isCompositing = false
      })
      this.textareaEl.addEventListener('keydown', this.onKeydown.bind(this))
      document.body.appendChild(this.textareaEl)
    }
    this.textareaEl.focus()
  }

  // 失焦
  blur() {
    if (!this.textareaEl) {
      return
    }
    this.textareaEl.blur()
  }

  // 输入事件
  onInput(e) {
    setTimeout(() => {
      let data = e.data
      if (!data || this.isCompositing) {
        return
      }
      // 插入字符
      let arr = data.split('')
      let length = arr.length
      let cur = this.positionList[this.cursorPositionIndex]
      this.data.splice(
        this.cursorPositionIndex + 1,
        0,
        ...arr.map(item => {
          return {
            ...cur,
            value: item
          }
        })
      )
      // 重新渲染
      this.render()
      // 更新光标
      this.cursorPositionIndex += length
      this.computeAndRenderCursor(
        this.cursorPositionIndex,
        this.positionList[this.cursorPositionIndex].pageIndex
      )
    }, 0)
  }

  // 按键事件
  onKeydown(e) {
    console.log(e)
    if (e.keyCode === 8) {
      this.delete()
    }
  }

  // 删除
  delete() {
    if (this.cursorPositionIndex < 0) {
      return
    }
    this.data.splice(this.cursorPositionIndex, 1)
    this.render()
    this.cursorPositionIndex--
    let position = this.positionList[this.cursorPositionIndex]
    this.computeAndRenderCursor(
      this.cursorPositionIndex,
      position ? position.pageIndex : 0
    )
  }

  // 将相对于浏览器窗口的坐标转换成相对于页面canvas
  windowToCanvas(e, canvas) {
    let { left, top } = canvas.getBoundingClientRect()
    return {
      x: e.clientX - left,
      y: e.clientY - top
    }
  }

  // 将相对于页面canvas的坐标转换成相对于容器元素的
  canvasToContainer(x, y, canvas) {
    return {
      x: x + canvas.offsetLeft,
      y: y + canvas.offsetTop
    }
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
