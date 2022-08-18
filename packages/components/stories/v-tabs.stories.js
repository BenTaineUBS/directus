import VTabs from '../src/components/v-tabs.vue';
document.body.classList.add('light')

export default {
    title: 'Example/VTabs',
    component: VTabs,
    argTypes: {

    },
};

const Template = (args) => ({
    setup() {
        return { args };
    },
    template: `
<div>
    <v-tabs v-bind="args" >
        <v-tab>Foods</v-tab>
        <v-tab>Drinks</v-tab>
        <v-tab>Extras</v-tab>
    </v-tabs>
    <v-tabs-items :modelValue="args.modelValue">
        <v-tab-item>
            <h1>This is the first page</h1>
        </v-tab-item>
        <v-tab-item>
            <h1>This is the second page</h1>
        </v-tab-item>
        <v-tab-item>
            <h1>This is the third page</h1>
        </v-tab-item>
    </v-tabs-items>
</div>
    `,
});

export const Primary = Template.bind({});
Primary.args = {
    modelValue: [1]
};