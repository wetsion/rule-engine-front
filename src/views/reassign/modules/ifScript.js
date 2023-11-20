import { checkEdgeExist } from '@/views/reassign/modules/commonValidateNode'

const ifPorts = {
  groups: {
    top: {
      position: 'top',
      attrs: {
        circle: {
          r: 4,
          magnet: true,
          stroke: '#5F95FF',
          strokeWidth: 1,
          fill: '#fff',
          style: {
            visibility: 'hidden'
          }
        }
      }
    },
    right: {
      position: 'right',
      attrs: {
        circle: {
          r: 4,
          magnet: true,
          stroke: '#5F95FF',
          strokeWidth: 1,
          fill: '#fff',
          style: {
            visibility: 'hidden'
          }
        }
      }
    },
    bottom: {
      position: 'bottom',
      attrs: {
        circle: {
          r: 4,
          magnet: true,
          stroke: '#5F95FF',
          strokeWidth: 1,
          fill: '#fff',
          style: {
            visibility: 'hidden'
          }
        }
      }
    }
  },
  items: [
    {
      group: 'top'
    },
    {
      group: 'right'
    },
    {
      group: 'bottom'
    }
  ]
}

export { ifPorts }

const type = 'if_script'

export default function validateEdge (edge, cellIdMap, edgeUniqArr, portRelatedAsSourceCountMap, portRelatedAsTargetCountMap) {
  console.log('if-script')
  if (checkEdgeExist(edge, edgeUniqArr)) {
    console.log('if check false')
    return false
  }
  const sourceCell = cellIdMap[edge.source.cell]
  const targetCell = cellIdMap[edge.target.cell]
  if (targetCell.shape === type) {
    // 边的目标节点是 ifScript
    // 只能连接 top 连接点
    let pos = ''
    targetCell.port.ports.forEach(item => {
      if (edge.target.port === item.id) {
        pos = item.group
      }
    })
    return pos === 'top'
  } else if (sourceCell.shape === type) {
    // 边的来源节点是 ifScript
    console.log(targetCell)
    const uniqSourcePort = edge.source.cell + '_' + edge.source.port
    // 条件节点，连接点已经作为目标连接时，不能再作为起点
    const count = portRelatedAsTargetCountMap[uniqSourcePort] || 0
    if (count > 0) {
      return false
    }
    let pos = ''
    sourceCell.port.ports.forEach(item => {
      if (edge.source.port === item.id) {
        pos = item.group
      }
    })
    if (pos === 'right') {
      edge.appendLabel({
        attrs: {
          text: {
            text: '否'
          }
        }
      })
    } else if (pos === 'bottom') {
      edge.appendLabel({
        attrs: {
          text: {
            text: '是'
          }
        }
      })
    }
    return true
  }
  return true
}
