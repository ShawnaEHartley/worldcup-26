// Coordinate constants for the corner-to-corner goal-line canvas.
// All values are in SVG units matching the viewBox (VIEWBOX_WIDTH × VIEWBOX_HEIGHT).
// lineX (0–1) maps directly: SVG x = lineX * VIEWBOX_WIDTH.

export const VIEWBOX_WIDTH = 100
export const VIEWBOX_HEIGHT = 28

// Horizontal: left corner flag = 0, right corner flag = VIEWBOX_WIDTH
// Goal posts derived from StatsBomb pitch (80 yards wide; posts at y=36 and y=44)
export const POST_LEFT_X = 45    // lineX 0.45
export const POST_RIGHT_X = 55   // lineX 0.55

// Vertical: ground at GROUND_Y, crossbar at CROSSBAR_Y
// Goal height is exaggerated relative to true scale so the goal reads clearly.
export const GROUND_Y = 22
export const CROSSBAR_Y = 14

export function toSVGX(lineX: number): number {
  return lineX * VIEWBOX_WIDTH
}
