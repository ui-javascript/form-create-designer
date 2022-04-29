import Vue from 'vue';
import ELEMENT from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
import formCreate from '@form-create/element-ui';
import App from './App';
import FcDesigner from '../src/index';

Vue.use(ELEMENT);
Vue.use(formCreate);
Vue.component('FcDesigner', FcDesigner);

Vue.config.productionTip = false;

window.addEventListener('message', init, false)

function init(event) {
    if (event.data.cmd === 'mountApp') {
        window.$JSON = event.data.data  
        window.$JSONPATH = event.data.jsonPath  

        new Vue({
            render: h => h(App),
        }).$mount('#app');
        
    }
}

