import VDivider from '../src/components/v-divider.vue';
document.body.classList.add('light')

export default {
    title: 'Example/VDivider',
    component: VDivider,
    argTypes: {

    },
};

const Template = (args) => ({
    setup() {
        return { args };
    },
    template: '<v-divider v-bind="args" />',
});

export const Primary = Template.bind({});
Primary.args = {
};