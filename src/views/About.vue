<template>
  <div class="container">
    <div class="sidbar">
      <div class="demo" ref="demo">
        <svg
          style="
            left: 1px;
            top: 1px;
            width: 32px;
            height: 30px;
            display: block;
            position: relative;
            overflow: hidden;
          "
        >
          <g>
            <g></g>
            <g>
              <g transform="translate(0.5,0.5)" style="visibility: visible">
                <rect
                  x="1.44"
                  y="7.68"
                  width="28.8"
                  height="14.4"
                  rx="2.16"
                  ry="2.16"
                  fill="#ffffff"
                  stroke="#000000"
                  stroke-width="1.3"
                  pointer-events="all"
                ></rect>
              </g>
            </g>
            <g></g>
            <g></g>
          </g>
        </svg>
      </div>
    </div>
    <div id="container" ref="container" class="graph"></div>
  </div>
</template>

<script>
import mxgraph from "@/mxgraph/index.js";
const { mxGraph, mxClient, mxUtils, mxCell, mxEvent, mxGeometry, mxPoint } =
  mxgraph;
export default {
  mounted() {
    if (!mxClient.isBrowserSupported()) {
      mxUtils.error("Browser is not supported!", 200, false);
    } else {
      let graph = new mxGraph(this.$refs.container);

      // Returns the graph under the mouse

      // var graphF = function (evt) {
      //   var x = mxEvent.getClientX(evt);
      //   var y = mxEvent.getClientY(evt);
      //   var elt = document.elementFromPoint(x, y);

      //   for (var i = 0; i < graphs.length; i++) {
      //     if (mxUtils.isAncestorNode(graphs[i].container, elt)) {
      //       return graphs[i];
      //     }
      //   }

      //   return null;
      // };

      // Inserts a cell at the given location
      var funct = function (graph, evt, target, x, y) {
        var edge = new mxCell(
          "",
          new mxGeometry(0, 0, 0, 0),
          "endArrow=blockThin;html=1;labelPosition=left;verticalLabelPosition=middle;align=right;verticalAlign=middle;dashed=1;dashPattern=8 4;endFill=0;startArrow=oval;startFill=0;endSize=6;startSize=4;"
        );
        edge.geometry.setTerminalPoint(new mxPoint(0, 0), true);
        edge.geometry.setTerminalPoint(new mxPoint(160, 0), false);
        edge.geometry.relative = true;
        edge.edge = true;

        var cell = new mxCell(
          "",
          new mxGeometry(0, 0, 24, 16),
          "shape=message;html=1;outlineConnect=0;labelPosition=left;verticalLabelPosition=middle;align=right;verticalAlign=middle;spacingRight=5;labelBackgroundColor=#ffffff;fillColor=#C0C0C0;"
        );
        cell.geometry.relative = true;
        cell.vertex = true;
        cell.geometry.offset = new mxPoint(8, -8);
        edge.insert(cell);

        cell.vertex = true;
        var cells = graph.importCells([edge], x, y, target);

        if (cells != null && cells.length > 0) {
          graph.scrollCellToVisible(cells[0]);
          graph.setSelectionCells(cells);
        }
      };

      if (mxClient.IS_IE) {
        mxEvent.addListener(this.$refs.demo, "dragstart", function (evt) {
          evt.returnValue = false;
        });
      }

      var dragElt = document.createElement("div");
      dragElt.style.border = "solid red 1px";
      dragElt.style.width = "120px";
      dragElt.style.height = "40px";

      // let preview = document.createElement("div");
      // preview.style= "width:100px;height:100px"
      var ds = mxUtils.makeDraggable(
        this.$refs.demo,
        graph,
        funct,
        dragElt,
        0,
        0,
        graph.autoscroll,
        true,
        true
      );

      // Redirects feature to global switch. Note that this feature should only be used
      // if the the x and y arguments are used in funct to insert the cell.
      ds.isGuidesEnabled = function () {
        return graph.graphHandler.guidesEnabled;
      };
    }
  },
  methods: {},
};
</script>

<style lang="scss">
* {
  margin: 0;
  padding: 0;
}
.container {
  display: flex;
  height: 100vh;
  flex-flow: row nowrap;
  .sidbar {
    flex: 0 0 200px;
    border: 1px solid;
    .demo {
      width: 50px;
      height: 50px;
      // background: red;
    }
  }
  .graph {
    flex: 1 1;
    border: 1px solid red;
    margin: 0 20px;
  }
}
</style>
