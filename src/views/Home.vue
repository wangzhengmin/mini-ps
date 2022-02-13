<template>
  <div>
    <button @click="exportSvg">导出svg</button>
    <button @click="setLink">设置链接</button>
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
    <div v-html="svg"></div>
  </div>
</template>

<script>
import mxgraph from "@/mxgraph/index.js";
const {
  mxGraph,
  mxClient,
  mxUtils,
  mxConstants,
  mxRectangle,
  mxSvgCanvas2D,
  mxImageExport,
} = mxgraph;
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
      svg: "",
    };
  },
  mounted() {
    this.init();
  },
  methods: {
    // 初始化graph
    init() {
      if (!mxClient.isBrowserSupported()) {
        mxUtils.error("Browser is not supported!", 200, false);
      } else {
        let graph = new mxGraph(this.$refs.container);
        this.graph = graph;

        // 使用htmlLable
        graph.setHtmlLabels(true);
        graph.getLabel = function (cell) {
          if (typeof cell.value === "object") {
            return cell.value.getAttribute("label");
          } else {
            return cell.value;
          }
        };

        // 创建图形
        this.shapes = createBasicShapes();
      }
    },
    getGraphBounds() {
      console.log(this.graph);
      var b = this.graph.view.graphBounds;

      if (this.graph.useCssTransforms) {
        var t = this.graph.currentTranslate;
        var s = this.graph.currentScale;

        b = new mxRectangle(
          (b.x + t.x) * s,
          (b.y + t.y) * s,
          b.width * s,
          b.height * s
        );
      }

      return b;
    },
    createSvgCanvas(node) {
      var canvas = new mxSvgCanvas2D(node);

      canvas.pointerEvents = true;

      return canvas;
    },
    createSvgImageExport() {
      var exp = new mxImageExport();
      let that = this;
      // Adds hyperlinks (experimental)
      exp.getLinkForCellState = mxUtils.bind(this, function (state) {
        return that.getLinkForCell(state.cell);
      });

      return exp;
    },
    // 导出svg
    exportSvg(e, scale, border, nocrop, crisp, hasShadow) {
      let graph = this.graph;
      scale = scale != null ? scale : 1;
      border = border != null ? border : 0;
      crisp = crisp != null ? crisp : true;
      hasShadow = false;

      var bounds = this.getGraphBounds();
      console.log(bounds);
      var vs = graph.view.scale;
      console.log(scale, vs);
      var svgDoc = mxUtils.createXmlDocument();
      var root =
        svgDoc.createElementNS != null
          ? svgDoc.createElementNS(mxConstants.NS_SVG, "svg")
          : svgDoc.createElement("svg");

      if (svgDoc.createElementNS == null) {
        root.setAttribute("xmlns", mxConstants.NS_SVG);
        root.setAttribute("xmlns:xlink", mxConstants.NS_XLINK);
      } else {
        // KNOWN: Ignored in IE9-11, adds namespace for each image element instead. No workaround.
        root.setAttributeNS(
          "http://www.w3.org/2000/xmlns/",
          "xmlns:xlink",
          mxConstants.NS_XLINK
        );
      }

      var s = scale / vs;
      var w =
        Math.max(1, Math.ceil(bounds.width * s) + 2 * border) +
        (hasShadow ? 5 : 0);
      var h =
        Math.max(1, Math.ceil(bounds.height * s) + 2 * border) +
        (hasShadow ? 5 : 0);
      console.log(s, w, h);
      root.setAttribute("version", "1.1");
      root.setAttribute("width", w + "px");
      root.setAttribute("height", h + "px");
      root.setAttribute(
        "viewBox",
        (crisp ? "-0.5 -0.5" : "0 0") + " " + w + " " + h
      );
      svgDoc.appendChild(root);

      var group =
        svgDoc.createElementNS != null
          ? svgDoc.createElementNS(mxConstants.NS_SVG, "g")
          : svgDoc.createElement("g");
      root.appendChild(group);
      var svgCanvas = this.createSvgCanvas(group);
      svgCanvas.foOffset = crisp ? -0.5 : 0;
      svgCanvas.textOffset = crisp ? -0.5 : 0;
      svgCanvas.imageOffset = crisp ? -0.5 : 0;
      svgCanvas.translate(
        Math.floor(border / scale - bounds.x / vs),
        Math.floor(border / scale - bounds.y / vs)
      );

      let imgExport = this.createSvgImageExport();

      var imgExportGetLinkForCellState = imgExport.getLinkForCellState;
      imgExport.getLinkForCellState = function () {
        var result = imgExportGetLinkForCellState.apply(this, arguments);

        return result != null && !(result.substring(0, 5) == "data:")
          ? result
          : null;
      };
      let that = this;
      imgExport.getLinkTargetForCellState = function (state) {
        console.log(state);
        return that.getLinkTargetForCell(state.cell);
      };
      // this.updateSvgLinks(root, null, true);
      imgExport.drawState(
        graph.getView().getState(graph.model.root),
        svgCanvas
      );

      this.svg = root.outerHTML;
    },
    getLinkTargetForCell(cell) {
      if (cell.value != null && typeof cell.value == "object") {
        return cell.value.getAttribute("linkTarget");
      }

      return null;
    },
    // 获取图形数据
    getFileData() {},
    // 导入svg
    importSvg() {},
    // 获取cell中的链接 link
    getLinkForCell(cell) {
      if (cell.value != null && typeof cell.value == "object") {
        var link = cell.value.getAttribute("link");

        // Removes links with leading javascript: protocol
        // TODO: Check more possible attack vectors
        if (
          link != null &&
          link.toLowerCase().substring(0, 11) === "javascript:"
        ) {
          link = link.substring(11);
        }

        return link;
      }

      return null;
    },
    updateSvgLinks(node, target, removeCustom) {
      var links = node.getElementsByTagName("a");

      for (var i = 0; i < links.length; i++) {
        if (links[i].getAttribute("target") == null) {
          var href = links[i].getAttribute("href");

          if (href == null) {
            href = links[i].getAttribute("xlink:href");
          }

          if (href != null) {
            if (target != null && /^https?:\/\//.test(href)) {
              links[i].setAttribute("target", target);
            } else if (removeCustom && this.isCustomLink(href)) {
              links[i].setAttribute("href", "javascript:void(0);");
            }
          }
        }
      }
    },
    // 设置链接
    setLink() {
      let graph = this.graph;
      let cell = graph.getSelectionCell();

      var value = null;

      if (cell.value != null && typeof cell.value == "object") {
        value = cell.value.cloneNode(true);
      } else {
        var doc = mxUtils.createXmlDocument();

        value = doc.createElement("UserObject");
        value.setAttribute("label", cell.value || "");
      }

      value.setAttribute("link", "attributeValue");
      graph.model.setValue(cell, value);
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
