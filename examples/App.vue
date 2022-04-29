<template>
    <div id="app">
        <div class="_fc-t-header">
            <div class="_fc-t-name">form-create-designer</div>
            <div class="_fc-t-menu">
                <el-button size="mini" icon="fc-icon icon-import" @click="setJson">导入Rule</el-button>
                <el-button size="mini" icon="fc-icon icon-import" @click="setOption">导入Option</el-button>
                
                <el-button size="mini" type="primary" @click="showJson">预览Rule</el-button>
                <el-button size="mini" type="success" @click="showOption">预览Option</el-button>
                <el-button size="mini" type="danger" @click="showTemplate">更新当前JSON文件</el-button>
            </div>
        </div>
        <fc-designer ref="designer"/>

        <el-dialog :title="title[type]" :visible.sync="state" class="_fc-t-dialog">
            <div ref="editor" v-if="state"></div>
            <span style="color: red;" v-if="err">输入内容格式有误!</span>
            <span slot="footer" class="dialog-footer">
                <el-button @click="state = false" size="small">取 消</el-button>
                <el-button type="primary" @click="onOk" size="small">确 定</el-button>
            </span>
        </el-dialog>
    </div>
</template>

<script>
import jsonlint from 'jsonlint-mod';
import 'codemirror/lib/codemirror.css';
import 'codemirror/addon/lint/lint.css';
import CodeMirror from 'codemirror/lib/codemirror';
import 'codemirror/addon/lint/lint';
import 'codemirror/addon/lint/json-lint';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/vue/vue';
import 'codemirror/mode/xml/xml';
import 'codemirror/mode/css/css';
import 'codemirror/addon/mode/overlay';
import 'codemirror/addon/mode/simple';
import 'codemirror/addon/selection/selection-pointer';
import 'codemirror/mode/handlebars/handlebars';
import 'codemirror/mode/htmlmixed/htmlmixed';
import 'codemirror/mode/pug/pug';

import is from '@form-create/utils/lib/type';
import formCreate from '@form-create/element-ui';

const TITLE = ['生成规则', '表单规则', '更新文件', '设置生成规则', '设置表单规则'];

export default {
    name: 'app',
    data() {
        return {
            state: false,
            value: null,
            title: TITLE,
            editor: null,
            err: false,
            type: -1,
            jsonType: 'Array',
        };
    },
    watch: {
        state(n) {
            if (!n) {
                this.value = null;
                this.err = false;
            }
        },
        value() {
            this.load();
        }
    },
    methods: {
        load() {
            let val;
            if(this.type === 2){
                val = this.value;
            }else if(this.type === 0){
                val = formCreate.toJson(this.value, 2);
            }else{
                val = JSON.stringify(this.value, null, 2);
            }
            this.$nextTick(() => {
                this.editor = CodeMirror(this.$refs.editor, {
                    lineNumbers: true,
                    mode: 'application/json',
                    gutters: ['CodeMirror-lint-markers'],
                    lint: true,
                    line: true,
                    tabSize: 2,
                    lineWrapping: true,
                    value: val || ''
                });
                this.editor.on('blur', () => {
                    this.err = this.editor.state.lint.marked.length > 0;
                });
            });
        },
        onValidationError(e) {
            this.err = e.length !== 0;
        },
        showJson() {
            this.state = true;
            this.type = 0;
            this.value = this.$refs.designer.getRule();
        },

        showOption() {
            this.state = true;
            this.type = 1;
            this.value = this.$refs.designer.getOption();
        },
        showTemplate() {
            this.state = true;
            this.type = 2;
            // this.value = this.makeTemplate();

            let code;
            if (this.jsonType == 'Array') {
                code = this.$refs.designer.getRule()             
            } else if (this.jsonType == 'Object') {
                code = {
                    rule: this.$refs.designer.getRule(),
                    option: this.$refs.designer.getOption(),
                }
            }

            // this.value = this.$refs.designer.getRule()
            this.value = JSON.stringify(code,null,2)
            // this.value = formCreate.toJson(code).replaceAll('\\','\\\\');
            // this.value = formCreate.toJson(code).replaceAll('\\','\\\\').replaceAll(',',',\n').replaceAll('{','{\n').replaceAll('}','\n}')


        },


        setJson() {
            this.state = true;
            this.type = 3;
            this.value = [];
        },
        setOption() {
            this.state = true;
            this.type = 4;
            this.value = {form: {}};
        },


        onOk() {
            if (this.err) return;

            const json = this.editor.getValue();
            let val = JSON.parse(json);

            if (this.type === 3) { // 设置rule
                if (!Array.isArray(val)) {
                    this.err = true;
                    return;
                }
                this.$refs.designer.setRule(formCreate.parseJson(json));
            } else if (this.type === 1) { // 设置option
                if (!is.Object(val) || !val.form) {
                    this.err = true;
                    return;
                }
                this.$refs.designer.setOption(val);
            } else if (this.type == 2) { // 覆盖本地文件
                window.parent.postMessage({
                    cmd: 'writeFile',
                    data: {
                        code: val,    
                        jsonPath: window.$JSONPATH
                    }
                }, '*')
            }
            this.state = false;
        },
        makeTemplate() {
            const rule = this.$refs.designer.getRule();
            const opt = this.$refs.designer.getOption();
            return `<template>
  <form-create
    v-model="fapi"
    :rule="rule"
    :option="option"
    @submit="onSubmit"
  ></form-create>
</template>

<script>
import formCreate from "@form-create/element-ui";

export default {
  data () {
    return {
        fapi: null,
        rule: formCreate.parseJson('${formCreate.toJson(rule).replaceAll('\\','\\\\')}'),
        option: formCreate.parseJson('${JSON.stringify(opt)}')
    }
  },
  methods: {
    onSubmit (formData) {
      //todo 提交表单
    }
  }
}
<\/script>`;
        }
    },
    beforeCreate() {
        window.jsonlint = jsonlint;
    },
    mounted() {
        if (Array.isArray(window.$JSON)) { // 先判断是否为数组类型
            this.jsonType = "Array"
            this.$refs.designer.setRule(window.$JSON)
        } else if (is.Object(window.$JSON)) { // 先判断是否为对象类型
            this.jsonType = "Object"
            const rule = window.$JSON.rule 
            const option = window.$JSON.option
            
            if (rule) {
                this.$refs.designer.setRule(rule)
            }
            if (option) {
                this.$refs.designer.setOption(option)
            }
        }
    }
};

</script>

<style>
    ._fc-t-header {
        height: 60px;
        margin: 0 20px;
        position: relative;
        display: flex;
        align-items: center;
        cursor: default;
    }

    ._fc-t-logo {
        height: 26px;
    }

    ._fc-t-name {
        display: inline-block;
        color: rgba(0, 0, 0, 0.8);
        font-size: 20px;
        font-weight: 600;
        margin-left: 5px;
    }

    ._fc-t-menu {
        position: absolute;
        right: 0;
    }

    ._fc-t-menu i {
        font-size: 12px;
    }

    body {
        min-height: 100vh;
        padding: 0;
        margin: 0;
        display: flex !important;
        flex-direction: column !important;
        background-color: #fff;
    }

    #app {
        display: flex;
        flex-direction: column;
        flex: 1;
    }

    ._fc-copyright {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        padding: 0 20px;
        font-size: 16px;
        border-top: 1px solid #ECECEC;
        background-color: #fff;
        cursor: pointer;
    }

    ._fc-t-dialog .CodeMirror {
        height: 450px;
    }

    ._fc-t-dialog .CodeMirror-line {
        line-height: 16px !important;
        font-size: 13px !important;
    }

    .CodeMirror-lint-tooltip {
        z-index: 2021 !important;
    }

    ._fc-t-dialog .el-dialog__body {
        padding: 0px 20px;
    }
    ._fc-b-item{
      display: flex;
    }

</style>
