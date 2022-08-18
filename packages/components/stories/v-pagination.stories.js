import VPagination from '../src/components/v-pagination.vue';
document.body.classList.add('light')

export default {
    title: 'Example/VPagination',
    component: VPagination,
    argTypes: {

    },
};

const Template = (args) => ({
    setup() {
        return { args };
    },
    template: '<v-pagination v-bind="args" />',
});

export const Primary = Template.bind({});
Primary.args = {
    length: 7,
    totalVisible: 4,
    modelValue: 3
};