<template>
  <div>
    <button @click="exportSvg">导出svg</button>
    <button @click="setLink">设置链接</button>
    <input type="file" @change="handleImport" />
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
import * as Base64 from "js-base64";

const {
  mxGraph,
  mxClient,
  mxUtils,
  mxConstants,
  mxRectangle,
  mxSvgCanvas2D,
  mxImageExport,
  mxCodec,
  mxGraphModel,
} = mxgraph;
import createBasicShapes from "@/mxgraph/shapes/baseShape.js";
import pako from "pako";
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
    sanitizeSvg(div) {
      // Removes all attributes starting with on
      var all = div.getElementsByTagName("*");

      for (var i = 0; i < all.length; i++) {
        for (var j = 0; j < all[i].attributes.length; j++) {
          var attr = all[i].attributes[j];

          if (
            attr.name.length > 2 &&
            attr.name.toLowerCase().substring(0, 2) == "on"
          ) {
            all[i].removeAttribute(attr.name);
          }
        }
      }

      // Removes all script tags
      var scripts = div.getElementsByTagName("script");

      while (scripts.length > 0) {
        scripts[0].parentNode.removeChild(scripts[0]);
      }
    },
    clipSvgDataUri(dataUri) {
      // LATER Add workaround for non-default NS declarations with empty URI not allowed in IE11
      if (
        !mxClient.IS_IE &&
        !mxClient.IS_IE11 &&
        dataUri != null &&
        dataUri.substring(0, 26) == "data:image/svg+xml;base64,"
      ) {
        try {
          var div = document.createElement("div");
          div.style.position = "absolute";
          div.style.visibility = "hidden";

          // Adds the text and inserts into DOM for updating of size
          var data = decodeURIComponent(escape(atob(dataUri.substring(26))));
          var idx = data.indexOf("<svg");

          if (idx >= 0) {
            // Strips leading XML declaration and doctypes
            div.innerHTML = data.substring(idx);

            // Removes all attributes starting with on
            this.sanitizeSvg(div);

            // Gets the size and removes from DOM
            var svgs = div.getElementsByTagName("svg");

            if (svgs.length > 0) {
              document.body.appendChild(div);

              try {
                var size = svgs[0].getBBox();

                if (size.width > 0 && size.height > 0) {
                  div
                    .getElementsByTagName("svg")[0]
                    .setAttribute(
                      "viewBox",
                      size.x +
                        " " +
                        size.y +
                        " " +
                        size.width +
                        " " +
                        size.height
                    );
                  div
                    .getElementsByTagName("svg")[0]
                    .setAttribute("width", size.width);
                  div
                    .getElementsByTagName("svg")[0]
                    .setAttribute("height", size.height);
                }
              } catch (e) {
                // ignore
              } finally {
                document.body.removeChild(div);
              }

              dataUri = this.createSvgDataUri(mxUtils.getXml(svgs[0]));
            }
          }
        } catch (e) {
          // ignore
        }
      }

      return dataUri;
    },
    createSvgDataUri(svg) {
      return (
        "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)))
      );
    },
    // 处理导入
    handleImport(event) {
      let file = event.target.files[0];
      var reader = new FileReader();
      reader.onload = (e) => {
        if (file.type.substring(0, 9) == "image/svg") {
          // Checks if SVG contains content attribute
          var data = this.clipSvgDataUri(e.target.result);
          var comma = data.indexOf(",");
          var svgText = decodeURIComponent(
            escape(atob(data.substring(comma + 1)))
          );
          var root = mxUtils.parseXml(svgText);
          var svgs = root.getElementsByTagName("svg");

          if (svgs.length > 0) {
            var svgRoot = svgs[0];
            var cont = svgRoot.getAttribute("content");

            if (
              cont != null &&
              cont.charAt(0) != "<" &&
              cont.charAt(0) != "%"
            ) {
              cont = unescape(
                window.atob ? atob(cont) : Base64.decode(cont, true)
              );
            }

            if (cont != null && cont.charAt(0) == "%") {
              cont = decodeURIComponent(cont);
            }
            if (
              cont != null &&
              (cont.substring(0, 8) === "<mxfile " ||
                cont.substring(0, 14) === "<mxGraphModel ")
            ) {
              this.importSvg(cont);
            }
          }
        }
      };
      reader.readAsDataURL(file);
    },
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

      var vs = graph.view.scale;

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
    importSvg(data) {
      // let graph = this.graph;
      let text = this.zapGremlins(mxUtils.trim(data));

      var doc = mxUtils.parseXml(text);
      var diagrams = doc.getElementsByTagName("diagram");
      let node = this.parseDiagramNode(diagrams[0]);

      if (node != null && node.nodeName === "mxGraphModel") {
        let cells = this.importGraphModel(node, 0, 0, false);
        this.graph.setSelectionCells(cells);
      }
    },
    importGraphModel(node) {
      let graph = this.graph;
      var codec = new mxCodec(node.ownerDocument);
      var tempModel = new mxGraphModel();
      codec.decode(node, tempModel);
      var cells = [];
      // Clones cells to remove invalid edges
      var cloneMap = new Object();

      var layers = tempModel.getChildren(
        graph.cloneCell(tempModel.root, graph.isCloneInvalidEdges(), cloneMap)
      );

      var children = tempModel.getChildren(layers[0]);
      cells = graph.moveCells(children, 0, 0, false, graph.getDefaultParent());
      return cells;
    },
    parseDiagramNode(diagramNode, checked) {
      var text = mxUtils.trim(mxUtils.getTextContent(diagramNode));
      var node = null;

      if (text.length > 0) {
        var tmp = this.decompress(text, null, checked);

        if (tmp != null && tmp.length > 0) {
          node = mxUtils.parseXml(tmp).documentElement;
        }
      } else {
        var temp = mxUtils.getChildNodes(diagramNode);

        if (temp.length > 0) {
          // Creates new document for unique IDs within mxGraphModel
          var doc = mxUtils.createXmlDocument();
          doc.appendChild(doc.importNode(temp[0], true));
          node = doc.documentElement;
        }
      }

      return node;
    },
    decompress(data, inflate, checked) {
      if (data == null || data.length == 0 || typeof pako === "undefined") {
        return data;
      } else {
        var tmp = this.stringToArrayBuffer(atob(data));
        var inflated = decodeURIComponent(
          inflate
            ? pako.inflate(tmp, { to: "string" })
            : pako.inflateRaw(tmp, { to: "string" })
        );

        return checked ? inflated : this.zapGremlins(inflated);
      }
    },
    stringToArrayBuffer(data) {
      return Uint8Array.from(data, function (c) {
        return c.charCodeAt(0);
      });
    },
    zapGremlins(text) {
      var lastIndex = 0;
      var checked = [];

      for (var i = 0; i < text.length; i++) {
        var code = text.charCodeAt(i);

        // Removes all control chars except TAB, LF and CR
        if (
          !(
            (code >= 32 || code == 9 || code == 10 || code == 13) &&
            code != 0xffff &&
            code != 0xfffe
          )
        ) {
          checked.push(text.substring(lastIndex, i));
          lastIndex = i + 1;
        }
      }

      if (lastIndex > 0 && lastIndex < text.length) {
        checked.push(text.substring(lastIndex));
      }

      return checked.length == 0 ? text : checked.join("");
    },
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
