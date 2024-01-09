<template>
  <a-modal
    :title="title"
    :width="800"
    :visible="visible"
    :keyboard="false"
    :maskClosable="false"
    :confirmLoading="loading"
    @cancel="cancelSave"
  >
    <div style="border: 1px solid #ccc;">
      <Editor
        ref="editor"
        style="height: 400px;"
        :defaultConfig="editorConfig"
        v-model="html"
        @onCreated="onCreated"
      />
      <mention-modal
        v-if="isShowModal"
        :editor-pos="getEditorPos"
        @hideMentionModal="hideMentionModal"
        @insertMention="insertMention"
      ></mention-modal>
    </div>
  </a-modal>
</template>

<script>
import { h } from 'vue'
import { Boot, DomEditor } from '@wangeditor/editor'
import { Editor } from '@wangeditor/editor-for-vue'
import mentionModule from '@wangeditor/plugin-mention'
import MentionModal from '@/views/reassign/modules/MentionModal'

Boot.registerModule(mentionModule)

export default {
  name: 'EditExpressionForm',
  components: { Editor, MentionModal },
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
      editor: null,
      html: '',
      editorConfig: {
        placeholder: '请输入EL表达式',
        MENU_CONF: {},
        EXTEND_CONF: {
          mentionConfig: {
            showModal: this.showMentionModal,
            hideModal: this.hideMentionModal,
          }
        }
      },
      isShowModal: false
    }
  },
  computed: {
    title () {
      if (this.model) {
        return '编辑流程：' + this.model['chainName']
      }
      return '编辑流程'
    },
    getEditorPos () {
      return this.editor.getSelectionPosition()
    }
  },
  methods: {
    onCreated (editor) {
      this.editor = Object.seal(editor)
    },
    cancelSave () {
      this.$emit('cancel')
    },
    showMentionModal () {
      this.isShowModal = true
    },
    hideMentionModal () {
      this.isShowModal = false
    },
    insertMention (id, name) {
      console.log(id)
      console.log(name)
      const label = 'Node("' + name + '")'
      const mentionNode = {
        type: 'mention', // 必须是 'mention'
        value: label,
        info: { id },
        children: [{ text: '' }] // 必须有一个空 text 作为 children
      }
      const editor = this.editor
      if (editor) {
        editor.restoreSelection() // 恢复选区
        editor.deleteBackward('character') // 删除 '@'
        editor.insertNode(mentionNode) // 插入 mention
        editor.move(1) // 移动光标
      }
    }
  }
}
</script>
<style src="@wangeditor/editor/dist/css/style.css"></style>
