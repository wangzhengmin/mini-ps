import mxgraph from "@/mxgraph/index.js";
const {
  mxConnectionConstraint,
  mxActor,
  mxUtils,
  mxConstants,
  mxCellRenderer,
  mxPoint,
} = mxgraph;

mxActor.prototype.constraints = [
  new mxConnectionConstraint(new mxPoint(0.5, 0), true),
  new mxConnectionConstraint(new mxPoint(0.25, 0.2), false),
  new mxConnectionConstraint(new mxPoint(0.1, 0.5), false),
  new mxConnectionConstraint(new mxPoint(0, 0.75), true),
  new mxConnectionConstraint(new mxPoint(0.75, 0.25), false),
  new mxConnectionConstraint(new mxPoint(0.9, 0.5), false),
  new mxConnectionConstraint(new mxPoint(1, 0.75), true),
  new mxConnectionConstraint(new mxPoint(0.25, 1), true),
  new mxConnectionConstraint(new mxPoint(0.5, 1), true),
  new mxConnectionConstraint(new mxPoint(0.75, 1), true),
];

function StepShape() {
  mxActor.call(this);
}
mxUtils.extend(StepShape, mxActor);
StepShape.prototype.size = 0.2;
StepShape.prototype.fixedSize = 20;
StepShape.prototype.isRoundable = function () {
  return true;
};
StepShape.prototype.redrawPath = function (c, x, y, w, h) {
  var fixed = mxUtils.getValue(this.style, "fixedSize", "0") != "0";
  var s = fixed
    ? Math.max(
        0,
        Math.min(
          w,
          parseFloat(mxUtils.getValue(this.style, "size", this.fixedSize))
        )
      )
    : w *
      Math.max(
        0,
        Math.min(1, parseFloat(mxUtils.getValue(this.style, "size", this.size)))
      );
  var arcSize =
    mxUtils.getValue(
      this.style,
      mxConstants.STYLE_ARCSIZE,
      mxConstants.LINE_ARCSIZE
    ) / 2;
  this.addPoints(
    c,
    [
      new mxPoint(0, 0),
      new mxPoint(w - s, 0),
      new mxPoint(w, h / 2),
      new mxPoint(w - s, h),
      new mxPoint(0, h),
      new mxPoint(s, h / 2),
    ],
    this.isRounded,
    arcSize,
    true
  );
  c.end();
};

mxCellRenderer.registerShape("step", StepShape);
