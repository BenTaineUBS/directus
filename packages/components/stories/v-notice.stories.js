import VNotice from '../src/components/v-notice.vue';
document.body.classList.add('light')

export default {
    title: 'Example/VNotice',
    component: VNotice,
    argTypes: {
        type: {
            control: { type: 'select', options: ['normal','info', 'success', 'warning', 'danger'] },
        }
    },
};

const Template = (args) => ({
    setup() {
        return { args };
    },
    template: '<v-notice v-bind="args" >Making a pizza ist best done without ordering a pizza.</v-notice>',
});

export const Primary = Template.bind({});
Primary.args = {
};