<template>
  <a-modal
    title="新建流程"
    :width="640"
    :visible="visible"
    :confirmLoading="loading"
    @ok="addSubmit"
    @cancel="() => { $emit('cancel') }"
  >
    <a-spin :spinning="loading">
      <a-form :form="form" v-bind="formLayout">
        <a-form-item label="流程名">
          <a-input v-decorator="['chainName', {rules: [{required: true, min: 2, message: '请输入至少2个字符的流程名！'}]}]" />
        </a-form-item>
        <a-form-item label="流程描述">
          <a-input v-decorator="['chainDesc', {rules: [{required: true, min: 5, message: '请输入至少五个字符的流程描述！'}]}]" />
        </a-form-item>
      </a-form>
    </a-spin>
  </a-modal>
</template>

<script>
import pick from 'lodash.pick'
import { createChain } from '@/api/chain'

// 表单字段
const fields = ['chainName', 'chainDesc']

export default {
  name: 'CreateForm',
  props: {
    visible: {
      type: Boolean,
      required: true
    },
    loading: {
      type: Boolean,
      default: () => false
    }
  },
  data () {
    this.formLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 7 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 13 }
      }
    }
    return {
      form: this.$form.createForm(this),
      chain: {
        chainName: undefined,
        chainDesc: undefined
      }
    }
  },
  created () {
    console.log('custom modal created')

    // 防止表单未注册
    fields.forEach(v => this.form.getFieldDecorator(v))
  },
  methods: {
    addSubmit () {
      this.form.validateFields((errors, values) => {
        if (!errors) {
          console.log(values)
          createChain(values).then(res => {
            this.$notification['success']({
              message: '创建成功！'
            })
            this.form.resetFields()
            this.$emit('ok')
          }).catch(err => {
            console.log(err)
            this.$notification['error']({
              message: '创建失败',
              description: '请稍后重试'
            })
          })
        }
      })
    },
    cancelAdd () {
      this.form.resetFields()
      this.$emit('cancel')
    }
  }
}
</script>
