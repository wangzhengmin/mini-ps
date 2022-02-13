<template>
  <div class="w-shape-item" ref="shape"></div>
</template>

<script>
import mxgraph from "@/mxgraph/index.js";

import { toBase64 } from "js-base64";
const { mxUtils } = mxgraph;
export default {
  name: "shape-item",
  props: ["graph", "cells"],
  mounted() {
    this.initShape();
  },
  methods: {
    initShape() {
      let graph = this.$props.graph;
      let dom = this.$refs.shape;

      let { width, height } = dom.getBoundingClientRect();
      let dragPreview = this.createPreview();

      this.createThumb(width, height, dom);
      var ds = mxUtils.makeDraggable(
        dom,
        graph,
        this.createHandler,
        dragPreview,
        0,
        0,
        graph.autoscroll,
        true,
        true
      );

      ds.isGuidesEnabled = function () {
        return graph.graphHandler.guidesEnabled;
      };
    },
    // 创建preview
    createPreview() {
      let cells = this.$props.cells;
      let { width = 40, height = 60 } = cells?.[0]?.geometry || {};

      var dragElt = document.createElement("div");
      dragElt.style.width = width + "px";
      dragElt.style.height = height + "px";

      let svg = this.createThumb(width, height, dragElt);
      svg.setAttribute("version", 1.1);
      svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");

      const image = new Image();
      const svgString = svg.outerHTML;
      image.src = `data:image/svg+xml;base64,${toBase64(svgString)}`;

      dragElt.innerHTML = image.outerHTML;
      return dragElt;
    },
    // 创建handler用于处理图形
    createHandler(graph, evt, target, x, y) {
      var cell = this.$props.cells;
      var cells = graph.importCells(cell, x, y, target);

      if (cells != null && cells.length > 0) {
        graph.scrollCellToVisible(cells[0]);
        graph.setSelectionCells(cells);
      }
    },
    // 获取图形的svg
    createThumb(width, height, parent) {
      let graph = this.$props.graph;
      let cells = this.$props.cells;

      graph.view.scaleAndTranslate(1, 0, 0);
      graph.addCells(cells);
      var bounds = graph.getGraphBounds();

      var s =
        Math.floor(
          Math.min(width / bounds.width, height / bounds.height) * 100
        ) / 100;
      graph.view.scaleAndTranslate(
        s,
        Math.floor((width - bounds.width * s) / 2 / s - bounds.x),
        Math.floor((height - bounds.height * s) / 2 / s - bounds.y)
      );

      var node = null;
      node = graph.view.getCanvas().ownerSVGElement.cloneNode(true);
      graph.getModel().clear();

      node.style.overflow = "hidden";
      node.style.width = width + "px";
      node.style.height = height + "px";
      node.style.visibility = "";
      node.style.minWidth = "";
      node.style.minHeight = "";
      parent.appendChild(node);
      return node;
    },
  },
};
</script>

<style>
.w-shape-item {
  width: 60px;
  height: 40px;
  margin: 5px;
  /* border: 1px solid blue; */
}
</style>
