import request from '@/utils/request'

const api = {
  chainList: '/chain/page',
  snapshotList: '/chain/snapshots',
  saveChain: '/chain/save',
  createChain: '/chain/create',
  renderFromChain: '/chain/renderFromChain',
  renderFromSnapshot: '/chain/renderFromSnapshot'
}

export default api

export function getChainList (parameter) {
  return request({
    url: api.chainList,
    method: 'post',
    data: parameter
  })
}

export function getSnapshots (parameter) {
  return request({
    url: api.snapshotList,
    method: 'post',
    data: parameter
  })
}

export function createChain (parameter) {
  return request({
    url: api.createChain,
    method: 'post',
    data: parameter
  })
}

export function saveChain (parameter) {
  return request({
    url: api.saveChain,
    method: 'post',
    data: parameter
  })
}

export function renderFromChain (parameter) {
  return request({
    url: api.renderFromChain,
    method: 'get',
    params: parameter
  })
}

export function renderFromSnapshot (parameter) {
  return request({
    url: api.renderFromSnapshot,
    method: 'get',
    params: parameter
  })
}
