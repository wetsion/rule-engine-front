<template>
  <div class='diamond_outer'>
    <div class='diamond_text'>
      <a-tooltip>
        <template slot='title'>
          {{ label }}
        </template>
        <a-icon v-show='enableEditParam' type="form" style="color: #f5222d" />{{ label }}
      </a-tooltip>
    </div>
    <div class='diamond_top'></div>
    <div class='diamond_bottom'></div>
    <a-modal
      v-model="formVisible"
      title="编辑参数"
      :closable="false"
      :keyboard="false"
      :maskClosable="false"
      :footer="null">
      <a-form :form="form" @submit="handleOk">
        <a-form-item
          v-for="(k, index) in paramKeyDef"
          :key="k"
          :label="k"
          :label-col="formItemLayout.labelCol"
          :wrapper-col="formItemLayout.wrapperCol"
          :required="true"
        >
          <a-input
            v-decorator="[
              `properties[${k}]`,
              {
                validateTrigger: ['change', 'blur'],
                rules: [
                  {
                    required: true,
                    whitespace: true,
                    message: '参数值不能为空.',
                  },
                ],
              },
            ]"
            placeholder="请输入参数值"
          />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" html-type="submit">
            保存
          </a-button>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script>
import pick from 'lodash.pick'

const formItemLayout = {
  labelCol: { span: 6 },
  wrapperCol: { span: 6 }
}
export default {
  name: 'IfScriptNode',
  inject: ['getNode'],
  data () {
    return {
      form: this.$form.createForm(this),
      formItemLayout,
      onGraph: false,
      formVisible: false,
      label: '',
      code: '',
      paramKeyDef: [],
      properties: {}
    }
  },
  computed: {
    enableEditParam () {
      return this.onGraph && this.paramKeyDef.length > 0
    }
  },
  mounted () {
    this.paramKeyDef.forEach(v => this.form.getFieldDecorator(v))
    if (this.rerender) {
      if (this.paramKeyDef.length > 0) {
        const rd = pick(this.properties, this.paramKeyDef)
        this.form.setFieldsValue(rd)
      }
    }
  },
  created () {
    const self = this
    const node = this.getNode()
    console.log(node.getData())
    const { onGraph, label, code, paramKeyDef, properties, rerender } = node.getData()
    self.onGraph = onGraph
    self.label = label
    self.code = code
    self.paramKeyDef = paramKeyDef || []
    self.properties = properties
    self.rerender = rerender || false

    node.on('change:data', ({ current }) => {
      self.onGraph = current.onGraph
      self.label = current.label
      self.paramKeyDef = current.paramKeyDef
      self.properties = current.properties
      self.rerender = current.rerender || false
    })
    if (!this.rerender && this.onGraph && this.paramKeyDef.length > 0) {
      this.formVisible = true
    }
  },
  methods: {
    clickNode () {
      if (this.paramKeyDef.length > 0) {
        console.log('click')
        console.log(this.properties)
        this.formVisible = true
      } else {
        this.$notification['warn']({
          message: '当前右键规则无可配置参数～'
        })
      }
    },
    handleOk (e) {
      // 保存，将当前输入的值更新到节点的data
      e.preventDefault()
      this.form.validateFields((err, values) => {
        if (!err) {
          console.log(values)
          console.log(this.properties)
          this.formVisible = false
          const node = this.getNode()
          node.setData({
            properties: values
          })
        }
      })
    },
    handleCancel (e) {
      // 取消，删除当前输入的值，用修改前的数据覆盖回去
      e.preventDefault()
      this.form.validateFields((err, values) => {
        if (!err) {
          const rd = pick(this.properties, this.paramKeyDef)
          this.form.setFieldsValue(rd)
          this.formVisible = false
        }
      })
    }
  }
}
</script>

<style scoped>
.diamond_outer {
  width: 100%;
  overflow: hidden
}
.diamond_top {
  width: 0;
  height: 0;
  border-bottom: 20px solid #5F95FF;
  border-left: 40px solid white;
  border-right: 40px solid white;
}
.diamond_bottom {
  width: 0;
  height: 0;
  border-top: 20px solid #5F95FF;
  border-left: 40px solid white;
  border-right: 40px solid white;
}
.diamond_text {
  width: 90%;
  height: 40px;
  text-align: center;
  line-height: 40px;
  float: left;
  font-weight: bold;
  overflow: hidden
}
</style>
