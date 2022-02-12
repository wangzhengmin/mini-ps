<template>
  <div class="w-container">
    <div class="w-aside">
      <shape-item
        :graph="graph"
        v-for="(shape, index) in shapes"
        :key="index"
        :cells="shape"
      ></shape-item>
    </div>
    <div class="w-body" ref="container"></div>
  </div>
</template>

<script>
import mxgraph from "@/mxgraph/index.js";
const { mxGraph, mxClient, mxUtils } = mxgraph;
import createBasicShapes from "@/mxgraph/shapes/baseShape.js";
import "@/mxgraph/Shapes.js";
import ShapeItem from "@/components/ShapeItem.vue";
export default {
  components: {
    ShapeItem,
  },
  data() {
    return {
      graph: null,
      shapes: [],
    };
  },
  mounted() {
    this.init();
  },
  methods: {
    init() {
      if (!mxClient.isBrowserSupported()) {
        mxUtils.error("Browser is not supported!", 200, false);
      } else {
        this.graph = new mxGraph(this.$refs.container);
        // 创建图形
        this.shapes = createBasicShapes();
      }
    },
  },
};
</script>

<style scoped lang="scss">
.w-container {
  display: flex;
  flex-flow: row nowrap;
  height: 200px;
  overflow: hidden;
  border: 1px solid red;
  padding: 20px;
  .w-aside {
    display: flex;
    flex-flow: row wrap;
    flex: 0 0 400px;
    border: 1px solid green;
  }
  .w-body {
    flex: 1 1;
    overflow: hidden;
    border: 1px solid blue;
  }
}
</style>
