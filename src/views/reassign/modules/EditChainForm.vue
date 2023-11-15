<template>
  <a-modal
    :title="title"
    :width="800"
    :visible="visible"
    :maskClosable="false"
    :confirmLoading="loading"
    @cancel="cancelSave"
  >
    <template slot="footer">
      <a-button key="back" @click="cancelSave">
        取消
      </a-button>
      <a-popconfirm placement="top" ok-text="Yes" cancel-text="No" @confirm="confirmSubmit">
        <template slot="title">
          <p>请输入备注：</p>
          <p><a-input v-model="comment" allow-clear/></p>
        </template>
        <a-button key="submit" type="primary">
          保存
        </a-button>
      </a-popconfirm>
    </template>
    <a-spin :spinning="loading">
      <div id="container">
        <div id="stencil"></div>
        <div id="graph-container"></div>
      </div>
    </a-spin>
  </a-modal>
</template>

<script>
import { Graph, Shape } from '@antv/x6'
import { Stencil } from '@antv/x6-plugin-stencil'
// import { register } from '@antv/x6-vue-shape
import { Snapline } from '@antv/x6-plugin-snapline'
import { Keyboard } from '@antv/x6-plugin-keyboard'
import { Selection } from '@antv/x6-plugin-selection'
import insertCss from 'insert-css'
import validateEdgeByScript, { ports } from './script'
import validateEdgeByIfScript, { ifPorts } from './ifScript'
import { saveChain } from '@/api/chain'
import { nodeGroup } from '@/api/ruleNode'

Graph.registerNode(
  'script',
  {
    inherit: 'rect',
    width: 50,
    height: 30,
    attrs: {
      body: {
        strokeWidth: 1,
        stroke: '#5F95FF',
        fill: '#EFF4FF'
      },
      text: {
        fontSize: 12,
        fill: '#262626'
      }
    },
    ports: ports
  },
  true
)

Graph.registerNode(
  'if_script',
  {
    inherit: 'polygon',
    width: 80,
    height: 50,
    attrs: {
      body: {
        strokeWidth: 1,
        stroke: '#5F95FF',
        fill: '#EFF4FF',
        refPoints: '0,10 10,0 20,10 10,20'
      },
      text: {
        fontSize: 12,
        fill: '#262626'
      }
    },
    ports: ifPorts
  },
  true
)

export default {
  name: 'EditChainForm',
  props: {
    visible: {
      type: Boolean,
      required: true
    },
    loading: {
      type: Boolean,
      default: () => false
    },
    model: {
      type: Object,
      default: () => null
    }
  },
  data () {
    return {
      validateEdgeMap: {
        'script': validateEdgeByScript,
        'if_script': validateEdgeByIfScript
      },
      // stencil 组定义
      groupsDef: [],
      // stencil 组下的节点定义
      nodesGroupDef: [],
      comment: '',
      // 连接点作为来源的计数
      portRelatedAsSourceCountMap: {},
      // 连接点作为目标的计数
      portRelatedAsTargetCountMap: {},
      // 节点对应的shape
      cellShapeMap: {},
      // cell id和cell对象的映射
      cellIdMap: {},
      graph: undefined
    }
  },
  computed: {
    title () {
      if (this.model) {
        return '编辑流程：' + this.model['chainName']
      }
      return '编辑流程'
    }
  },
  watch: {
    'visible': function (val) {
      if (val) {
        window.setTimeout(() => {
          nodeGroup().then(res => {
            console.log(res)
            this.groupsDef = res.data.groups
            this.nodesGroupDef = res.data.nodes
            this.initGraph()
          }).catch(error => {
            console.log(error)
            this.$notification['error']({
              message: '获取分流失败',
              description: '请关闭编辑窗口重试'
            })
          })
        }, 100)
      } else {
        this.resetChartData()
      }
    }
  },
  created () {},
  methods: {
    cancelSave () {
      this.$emit('cancel')
    },
    confirmSubmit () {
      if (this.comment === null || this.comment === '' || this.comment.length === 0) {
        this.$notification['error']({
          message: '保存失败',
          description: '请输入本次保存的备注'
        })
        return
      }
      const json = this.graph.toJSON()
      console.log(json)
      saveChain({
        id: this.model['chainId'],
        chartData: json,
        comment: this.comment
      }).then(res => {
        console.log(res)
        this.$emit('ok')
        this.$notification['success']({
          message: '快照保存成功'
        })
      }).catch(error => {
        console.log(error)
      })
    },
    // 展示连接桩
    showPorts (ports, show) {
      for (let i = 0, len = ports.length; i < len; i += 1) {
        ports[i].style.visibility = show ? 'visible' : 'hidden'
      }
    },
    recordPortRelatedCount (edge) {
      const uniqSourcePort = edge.source.cell + '_' + edge.source.port
      const uniqTargetPort = edge.target.cell + '_' + edge.target.port
      this.portRelatedAsSourceCountMap[uniqSourcePort] = (this.portRelatedAsSourceCountMap[uniqSourcePort] || 0) + 1
      this.portRelatedAsTargetCountMap[uniqTargetPort] = (this.portRelatedAsTargetCountMap[uniqTargetPort] || 0) + 1
    },
    minusPortRelatedCount (edge) {
      const uniqSourcePort = edge.source.cell + '_' + edge.source.port
      const uniqTargetPort = edge.target.cell + '_' + edge.target.port
      this.portRelatedAsSourceCountMap[uniqSourcePort] = (this.portRelatedAsSourceCountMap[uniqSourcePort] || 1) - 1
      this.portRelatedAsTargetCountMap[uniqTargetPort] = (this.portRelatedAsTargetCountMap[uniqTargetPort] || 1) - 1
    },
    recordCellShape (cell) {
      this.cellShapeMap[cell.id] = cell.shape
      this.cellIdMap[cell.id] = cell
    },
    checkEdgeValid (edge) {
      const sourceCellShape = this.cellShapeMap[edge.source.cell]
      const targetCellShape = this.cellShapeMap[edge.target.cell]
      if (!sourceCellShape || !targetCellShape) {
        return true
      }
      return this.validateEdgeMap[sourceCellShape](edge, this.cellIdMap, this.portRelatedAsSourceCountMap, this.portRelatedAsTargetCountMap) &&
        this.validateEdgeMap[targetCellShape](edge, this.cellIdMap, this.portRelatedAsSourceCountMap, this.portRelatedAsTargetCountMap)
    },
    resetChartData () {
      this.comment = null
      if (this.graph) {
        this.graph.dispose()
        this.graph = null
      }
      this.cellShapeMap = {}
      this.cellIdMap = {}
      this.portRelatedAsSourceCountMap = {}
      this.portRelatedAsTargetCountMap = {}
    },
    buildDataFromCells (cells) {
      if (!cells) {
        return
      }
      cells.forEach(cell => {
        if (cell.shape === 'edge') {
          // 边
          this.recordCellShape(cell)
          this.recordPortRelatedCount(cell)
        } else {
          // 节点
          this.recordCellShape(cell)
        }
      })
    },
    initGraph () {
      insertCss(`
        #container {
          display: flex;
          border: 1px solid #dfe3e8;
        }
        #stencil {
          width: 180px;
          height: 100%;
          border-right: 1px solid #dfe3e8;
        }
        #graph-container {
          width: calc(100% - 180px);
          height: 100%;
        }
        .x6-widget-stencil  {
          background-color: #fff;
          width: 180px;
        }
        .x6-widget-stencil-title {
          background-color: #fff;
        }
        .x6-widget-stencil-group-title {
          background-color: #fff !important;
        }
        .x6-widget-transform {
          margin: -1px 0 0 -1px;
          padding: 0px;
          border: 1px solid #239edd;
        }
        .x6-widget-transform > div {
          border: 1px solid #239edd;
        }
        .x6-widget-transform > div:hover {
          background-color: #3dafe4;
        }
        .x6-widget-transform-active-handle {
          background-color: #3dafe4;
        }
        .x6-widget-transform-resize {
          border-radius: 0;
        }
        .x6-widget-selection-inner {
          border: 1px solid #239edd;
        }
        .x6-widget-selection-box {
          opacity: 0;
        }
      `)
      const that = this
      const graph = new Graph({
        container: document.getElementById('graph-container'),
        height: 700,
        translating: {
          restrict: true
        },
        panning: true,
        mousewheel: {
          enabled: true,
          zoomAtMousePosition: true,
          modifiers: 'ctrl',
          minScale: 0.5,
          maxScale: 3,
        },
        grid: {
          visible: true,
          type: 'doubleMesh',
          args: [
            {
              color: '#eee', // 主网格线颜色
              thickness: 1 // 主网格线宽度
            },
            {
              color: '#ddd', // 次网格线颜色
              thickness: 1, // 次网格线宽度
              factor: 4 // 主次网格线间隔
            }
          ]
        },
        connecting: {
          router: 'manhattan',
          connector: {
            name: 'rounded',
            args: {
              radius: 8
            }
          },
          anchor: 'center',
          connectionPoint: 'anchor',
          allowBlank: false,
          allowMulti: false,
          snap: {
            radius: 20
          },
          createEdge () {
            return new Shape.Edge({
              attrs: {
                line: {
                  stroke: '#A2B1C3',
                  strokeWidth: 2,
                  targetMarker: {
                    name: 'block',
                    width: 12,
                    height: 8
                  }
                }
              },
              zIndex: 0
            })
          },
          validateConnection ({ sourceCell, targetCell, sourceMagnet, targetMagnet }) {
            if (sourceCell === targetCell) {
              return false
            }
            return !!targetMagnet
          },
          validateEdge ({ edge }) {
            console.log(edge)
            // 校验边是否可以创建
            if (!that.checkEdgeValid(edge)) {
              return false
            }
            // 记录点关联的次数
            that.recordPortRelatedCount(edge)
            return true
          }
        },
        highlighting: {
          magnetAdsorbed: {
            name: 'stroke',
            args: {
              attrs: {
                fill: '#5F95FF',
                stroke: '#5F95FF'
              }
            }
          }
        }
      })

      graph.use(new Snapline())
      graph.use(new Keyboard())
      graph.use(new Selection())

      graph.on('node:added', ({ node, index, options }) => {
        this.recordCellShape(node)
      })
      graph.on('edge:removed', ({ edge, index, options }) => {
        console.log('edge remove')
        console.log(edge)
        this.minusPortRelatedCount(edge)
      })
      // 控制连接桩显示/隐藏
      graph.on('node:mouseenter', ({ node }) => {
        console.log(node)
        const container = document.getElementById('graph-container')
        const ports = container.querySelectorAll(
          '.x6-port-body'
        )
        this.showPorts(ports, true)
      })
      graph.on('node:mouseleave', () => {
        const container = document.getElementById('graph-container')
        const ports = container.querySelectorAll(
          '.x6-port-body'
        )
        this.showPorts(ports, false)
      })
      graph.bindKey('backspace', () => {
        const cells = graph.getSelectedCells()
        if (cells.length) {
          graph.removeCells(cells)
        }
      })

      const stencil = new Stencil({
        title: '分流规则',
        target: graph,
        stencilGraphWidth: 180,
        stencilGraphHeight: 0,
        collapsable: true,
        search: (cell, keyword, groupName, stencil) => {
          if (keyword) {
            return cell.attr('text/text').includes(keyword)
          }
          return true
        },
        groups: this.groupsDef,
        layoutOptions: {
          columns: 2,
          columnWidth: 80,
          rowHeight: 'auto'
        }
      })
      for (const key in this.nodesGroupDef) {
        const nodesInGroup = this.nodesGroupDef[key] || []
        const newNodeList = []
        nodesInGroup.forEach(item => {
          newNodeList.push(graph.createNode(item))
        })
        stencil.load(newNodeList, key)
      }

      document.getElementById('stencil').appendChild(stencil.container)

      if (this.model.chartData) {
        const chartData = this.model['chartData']
        const cd = JSON.parse(chartData)
        this.buildDataFromCells(cd.cells)
        if (cd.cells) {
          graph.fromJSON(cd.cells)
        }
      }

      this.graph = graph
    }
  }
}
</script>
