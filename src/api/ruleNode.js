import request from '@/utils/request'

const api = {
  nodeGroup: '/rule/group'
}

export default api

export function nodeGroup () {
  return request({
    url: api.nodeGroup,
    method: 'get'
  })
}
