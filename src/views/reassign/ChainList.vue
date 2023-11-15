<template>
  <page-header-wrapper>
    <a-card :bordered="false">
      <div class="table-page-search-wrapper">
        <a-form layout="inline">
          <a-row :gutter="48">
            <a-col :md="8" :sm="24">
              <a-form-item label="流程编号">
                <a-input v-model="queryParam.id" placeholder=""/>
              </a-form-item>
            </a-col>
            <a-col :md="8" :sm="24">
              <a-form-item label="流程状态">
                <a-select v-model="queryParam.status" placeholder="请选择" default-value="0">
                  <a-select-option value="0">全部</a-select-option>
                  <a-select-option value="1">关闭</a-select-option>
                  <a-select-option value="2">运行中</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <template v-if="advanced">
              <a-col :md="8" :sm="24">
                <a-form-item label="更新日期">
                  <a-date-picker v-model="queryParam.date" style="width: 100%" placeholder="请输入更新日期"/>
                </a-form-item>
              </a-col>
            </template>
            <a-col :md="!advanced && 8 || 24" :sm="24">
              <span class="table-page-search-submitButtons" :style="advanced && { float: 'right', overflow: 'hidden' } || {} ">
                <a-button type="primary" @click="loadData">查询</a-button>
                <a-button style="margin-left: 8px" @click="() => this.queryParam = {}">重置</a-button>
                <a @click="toggleAdvanced" style="margin-left: 8px">
                  {{ advanced ? '收起' : '展开' }}
                  <a-icon :type="advanced ? 'up' : 'down'"/>
                </a>
              </span>
            </a-col>
          </a-row>
        </a-form>
      </div>

      <div class="table-operator">
        <a-button type="primary" icon="plus" @click="handleAdd">新建</a-button>
        <a-dropdown v-action:edit v-if="selectedRowKeys.length > 0">
          <a-menu slot="overlay">
            <a-menu-item key="1"><a-icon type="delete" />删除</a-menu-item>
            <!-- lock | unlock -->
            <a-menu-item key="2"><a-icon type="lock" />锁定</a-menu-item>
          </a-menu>
          <a-button style="margin-left: 8px">
            批量操作 <a-icon type="down" />
          </a-button>
        </a-dropdown>
      </div>

      <a-table
        ref="table"
        size="default"
        rowKey="id"
        :loading='tableLoading'
        :columns="columns"
        :data-source="rows"
        :pagination="pagination"
        showPagination="auto"
        :expandedRowKeys.sync="expandedRowKeys"
        :expandIconAsCell="false"
        :expandIconColumnIndex="5"
        @change="loadData"
      >
        <span slot="expandIcon" slot-scope='props'>
          <a-button type="primary" @click='expandRow(props)'>
            展开
          </a-button>
        </span>
        <template #expandedRowRender="{ record }">
          <a-table
            ref="snapshotTable"
            size="middle"
            rowKey="id"
            :loading='snapshotTableLoading'
            :columns="snapshotColumns"
            :data-source="snapshotRows"
            :pagination="snapshotPagination"
            showPagination="auto"
            @change="loadSnapshot"
          >
            <span slot="created" slot-scope="text">
              {{ formatTime(text) }}
            </span>
            <span slot="action" slot-scope="text, record">
              <template>
                <a @click="handleEditSnapshot(record)">编排</a>
                <a-divider type="vertical" />
                <a @click="handleDeploy(record)">发布/下线</a>
              </template>
            </span>
          </a-table>
        </template>
        <span slot="description" slot-scope="text">
          <ellipsis :length="4" tooltip>{{ text }}</ellipsis>
        </span>
        <span slot="created" slot-scope="text">
          {{ formatTime(text) }}
        </span>

        <span slot="action" slot-scope="text, record">
          <template>
            <a @click="handleEdit(record)">编排</a>
          </template>
        </span>
      </a-table>

      <create-form
        ref="createModal"
        :visible="createVisible"
        :loading="createConfirmLoading"
        @cancel="handleCreateCancel"
        @ok="handleCreateOk"
      />

      <edit-chain-form
        ref="editModal"
        :visible="visible"
        :loading="confirmLoading"
        :model="mdl"
        @cancel="handleCancel"
        @ok="handleOk"
      />
    </a-card>
  </page-header-wrapper>
</template>

<script>
import moment from 'moment'
import { STable, Ellipsis } from '@/components'
import { getChainList, getSnapshots, renderFromChain, renderFromSnapshot } from '@/api/chain'

import StepByStepModal from './modules/StepByStepModal'
import EditChainForm from './modules/EditChainForm'
import CreateForm from './modules/CreateForm'

const snapshotColumns = [
  {
    title: '快照编号',
    dataIndex: 'id'
  },
  {
    title: '快照备注',
    dataIndex: 'comment',
  },
  {
    title: '状态',
    dataIndex: 'status',
  },
  {
    title: '创建时间',
    dataIndex: 'created',
    sorter: true,
    scopedSlots: { customRender: 'created' }
  },
  {
    title: '操作',
    dataIndex: 'action',
    width: '150px',
    scopedSlots: { customRender: 'action' }
  }
]

const columns = [
  {
    title: '编号',
    dataIndex: 'id'
  },
  {
    title: '流程名',
    dataIndex: 'chainName'
  },
  {
    title: '描述',
    dataIndex: 'chainDesc',
    scopedSlots: { customRender: 'description' }
  },
  {
    title: '状态',
    dataIndex: 'status'
  },
  {
    title: '创建时间',
    dataIndex: 'created',
    sorter: true,
    scopedSlots: { customRender: 'created' }
  },
  {
    title: '历史版本',
    dataIndex: 'history',
    sorter: false
  },
  {
    title: '操作',
    dataIndex: 'action',
    width: '150px',
    scopedSlots: { customRender: 'action' }
  }
]

const statusMap = {
  0: {
    status: 'default',
    text: '关闭'
  },
  1: {
    status: 'processing',
    text: '运行中'
  },
  2: {
    status: 'success',
    text: '已上线'
  },
  3: {
    status: 'error',
    text: '异常'
  }
}

export default {
  name: 'TableList',
  components: {
    STable,
    Ellipsis,
    EditChainForm,
    CreateForm,
    StepByStepModal
  },
  data () {
    this.columns = columns
    this.snapshotColumns = snapshotColumns
    return {
      // create model
      createVisible: false,
      visible: false,
      createConfirmLoading: false,
      confirmLoading: false,
      mdl: null,
      // 高级搜索 展开/关闭
      advanced: false,
      // 查询参数
      queryParam: {},
      pagination: {},
      snapshotPagination: {},
      tableLoading: false,
      snapshotTableLoading: false,
      expandedRowKeys: [],
      rows: [],
      snapshotRows: [],
      selectedRowKeys: [],
      selectedRows: []
    }
  },
  filters: {
    statusFilter (type) {
      return statusMap[type].text
    },
    statusTypeFilter (type) {
      return statusMap[type].status
    }
  },
  created () {
    this.loadData()
  },
  mounted () {
    this.loadData()
  },
  computed: {
    rowSelection () {
      return {
        selectedRowKeys: this.selectedRowKeys,
        onChange: this.onSelectChange
      }
    }
  },
  methods: {
    formatTime (time) {
      return moment(parseInt(time) * 1000).format('yyyy/MM/DD HH:mm:ss')
    },
    expandRow (expanded) {
      if (this.expandedRowKeys.find(item => expanded.record.id === item)) {
        this.expandedRowKeys = []
        this.snapshotRows = []
        this.snapshotPagination = {}
      } else {
        this.expandedRowKeys = []
        this.expandedRowKeys.push(expanded.record.id)
        this.loadSnapshot()
      }
    },
    loadSnapshot (pagination, filters, sorter) {
      const pager = { ...this.snapshotPagination }
      pager.current = (pagination && pagination.current) || 1
      pager.pageSize = (pagination && pagination.pageSize) || 5
      this.snapshotPagination = pager
      this.snapshotTableLoading = true
      getSnapshots({ pageNo: pager.current, pageSize: pager.pageSize, chainId: this.expandedRowKeys[0] }).then(res => {
        const pagination = { ...this.snapshotPagination }
        this.snapshotRows = res.data.data
        pagination.total = res.data.totalCount
        this.snapshotPagination = pagination
        this.snapshotTableLoading = false
      }).catch(error => {
        console.log(error)
        this.$notification['error']({
          message: '查询快照失败',
          description: '请稍后重试'
        })
        this.snapshotTableLoading = false
      })
    },
    loadData (pagination, filters, sorter) {
      const pager = { ...this.pagination }
      pager.current = (pagination && pagination.current) || 1
      pager.pageSize = (pagination && pagination.pageSize) || 10
      this.pagination = pager
      const requestParameters = this.queryParam
      requestParameters['pageNo'] = pager.current
      requestParameters['pageSize'] = pager.pageSize
      this.doLoadData(requestParameters)
    },
    doLoadData (requestParameters = {}) {
      this.tableLoading = true
      getChainList(requestParameters).then((res) => {
        const pagination = { ...this.pagination }
        this.rows = res.data.data
        pagination.total = res.data.totalCount
        this.pagination = pagination
        this.tableLoading = false
      }).catch(error => {
        console.log(error)
        this.$notification['error']({
          message: '查询失败',
          description: '查询流程失败'
        })
        this.tableLoading = false
      })
    },
    handleAdd () {
      this.createVisible = true
    },
    handleEditSnapshot (record) {
      renderFromSnapshot({ snapshotId: record.id }).then(res => {
        this.visible = true
        this.confirmLoading = true
        this.mdl = res.data
        window.setTimeout(() => {
          this.confirmLoading = false
        }, 1000)
      }).catch(error => {
        console.log(error)
        this.$notification['error']({
          message: '获取流程数据失败',
          description: '请稍后重试'
        })
      })
    },
    handleEdit (record) {
      renderFromChain({ chainId: record.id }).then(res => {
        this.visible = true
        this.confirmLoading = true
        this.mdl = res.data
        window.setTimeout(() => {
          this.confirmLoading = false
        }, 1000)
      }).catch(error => {
        console.log(error)
        this.$notification['error']({
          message: '获取流程数据失败',
          description: '请稍后重试'
        })
      })
    },
    handleCreateOk () {
      this.createConfirmLoading = true
      this.loadData()
      window.setTimeout(() => {
        this.createVisible = false
        this.createConfirmLoading = false
      }, 500)
    },
    handleOk () {
      this.mdl = null
      this.confirmLoading = true
      this.loadData()
      window.setTimeout(() => {
        this.visible = false
        this.confirmLoading = false
      }, 500)
    },
    handleCreateCancel () {
      this.createVisible = false
    },
    handleCancel () {
      this.visible = false
      this.mdl = null
    },
    handleSub (record) {
      if (record.status !== 0) {
        this.$message.info(`${record.no} 订阅成功`)
      } else {
        this.$message.error(`${record.no} 订阅失败，规则已关闭`)
      }
    },
    onSelectChange (selectedRowKeys, selectedRows) {
      this.selectedRowKeys = selectedRowKeys
      this.selectedRows = selectedRows
    },
    toggleAdvanced () {
      this.advanced = !this.advanced
    },
    resetSearchForm () {
      this.queryParam = {
        date: moment(new Date())
      }
    }
  }
}
</script>
