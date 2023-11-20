import { checkEdgeExist, checkEdgeLimit } from '@/views/reassign/modules/commonValidateNode'

const ports = {
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

export { ports }

export default function validateEdge (edge, cellIdMap, edgeUniqArr, portRelatedAsSourceCountMap, portRelatedAsTargetCountMap) {
  console.log('script')
  if (checkEdgeExist(edge, edgeUniqArr)) {
    console.log('check false')
    return false
  }
  if (checkEdgeLimit(edge, edgeUniqArr)) {
    return false
  }
  return true
}
