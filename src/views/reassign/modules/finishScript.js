import { checkEdgeExist } from '@/views/reassign/modules/commonValidateNode'

const finishPorts = {
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
    },
    left: {
      position: 'left',
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
    },
    {
      group: 'left'
    }
  ]
}

export { finishPorts }

const type = 'finish'

export default function validateEdge (edge, cellIdMap, edgeUniqArr, portRelatedAsSourceCountMap, portRelatedAsTargetCountMap) {
  if (checkEdgeExist(edge, edgeUniqArr)) {
    console.log('if check false')
    return false
  }
  const sourceCell = cellIdMap[edge.source.cell]
  if (sourceCell.shape === type) {
    // 结束节点不能作为起始节点
    return false
  }
  return true
}
