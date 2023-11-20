export function checkEdgeExist (edge, edgeUniqArr) {
  const uniqEdge = edge.source.cell + '_' + edge.target.cell
  const uniqEdge2 = edge.target.cell + '_' + edge.source.cell
  const ct = edgeUniqArr.filter(e => e.startsWith(uniqEdge) || e.startsWith(uniqEdge2)).length
  return ct >= 1
}

export function checkEdgeLimit (edge, edgeUniqArr) {
  const ct = edgeUniqArr.filter(e => e.startsWith(edge.source.cell)).length
  const reg = new RegExp('^.*(_' + edge.target.cell + '_).*$')
  const ct2 = edgeUniqArr.filter(e => reg.test(e)).length
  return ct >= 2 || ct2 >= 2
}
