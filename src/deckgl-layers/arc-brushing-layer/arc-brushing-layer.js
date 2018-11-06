// Copyright (c) 2018 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

import {ArcLayer} from 'deck.gl';
import {editShader} from 'deckgl-layers/layer-utils/shader-utils';

const defaultProps = {
  ...ArcLayer.defaultProps,
  // show arc if source is in brush
  brushSource: true,
  // show arc if target is in brush
  brushTarget: true,
  enableBrushing: true,
  getStrokeWidth: d => d.strokeWidth,
  strokeScale: 1,
  // brush radius in meters
  brushRadius: 100000,
  mousePosition: [0, 0]
};

const NUM_SEGMENTS = 50;

function addAnimationVsSeg(vs) {
  return editShader(
    vs,
    'arc animation segment',
    'float segmentIndex = positions.x;',

    `float segIndex = positions.x;
     float showPt = isDrawPoint(currentStep, segIndex, enableAnimation);
     float segmentIndex = mix(currentStep, segIndex, showPt);`
  )
}

function addBrushingVsShader(vs) {
  return editShader(
    vs,
    'arc brushing vs',
    'vec2 offset = getExtrusionOffset((next.xy - curr.xy) * indexDir, positions.y);',
    'vec2 offset = brushing_getExtrusionOffset((next.xy - curr.xy) * indexDir, positions.y, project_uViewportSize, instancePositions, instanceWidths);'
  );
}

function addBrushingVs64Shader(vs) {
  return editShader(
    vs,
    'arc brushing vs64',
    'vec2 offset = getExtrusionOffset(next_pos_clipspace.xy - curr_pos_clipspace.xy, positions.y);',
    'vec2 offset = brushing_getExtrusionOffset(next_pos_clipspace.xy - curr_pos_clipspace.xy, positions.y, project_uViewportSize, instancePositions, instanceWidths);'
  );
}

export default class ArcBrushingLayer extends ArcLayer {
  initializeState() {
    super.initializeState();

    Object.assign(this.state, {
      currentStep: NUM_SEGMENTS - 1,
      totalStep: NUM_SEGMENTS - 1,
      timerId: null,
      isAnimating: false
    });
  }

  getShaders() {
    const shaders = super.getShaders();
    return {
      vs: this.is64bitEnabled()
        ? addBrushingVs64Shader(shaders.vs)
        : addAnimationVsSeg(addBrushingVsShader(shaders.vs)),
      fs: shaders.fs,
      modules: shaders.modules.concat(['brushing', 'arc-animation'])
    };
  }

  updateState({props, oldProps, changeFlags}) {
    super.updateState({props, oldProps, changeFlags});

    if ( props.enableAnimation &&
      // !oldProps.enableAnimation &&
      !this.state.isAnimating && !this.state.timerId) {
      this.startAnimation();
    } else if (!props.enableAnimation && this.state.isAnimating) {
      this.stopAnimation();
    }
  }

  startAnimation() {
    console.log('start animation');

    this.state.currentStep = -1;
    this.state.isAnimating = true;

    this.state.timerId = window.setInterval(this.animateStep.bind(this), 80);
  }

  stopAnimation() {
    console.log('stop animation');

    window.clearInterval(this.state.timerId);
    this.state.timerId = null;
    this.state.isAnimating = false;
    this.state.currentStep = NUM_SEGMENTS - 1;
  }

  animateStep() {
    if (this.state) {
      if (this.state.currentStep < this.state.totalStep) {
        this.state.currentStep++;
      } else if (this.state.currentStep >= this.state.totalStep) {
        this.stopAnimation();
      }
      this.setUniforms({
        currentStep: this.state.currentStep,
        enableAnimation: 1
      });

      // this.draw({
      //   uniforms: {
      //     currentStep: this.state.currentStep
      //   }
      // })
    }
  }

  draw(opts) {
    const {uniforms} = opts;

    const {
      brushSource,
      brushTarget,
      brushRadius,
      enableBrushing,
      mousePosition,
      strokeScale,
      enableAnimation
    } = this.props;

    super.draw({
      ...opts,
      uniforms: {
        ...uniforms,
        numSegments: NUM_SEGMENTS,
        enableAnimation: enableAnimation ? 1 : 0,
        brushing_uBrushSource: brushSource ? 1 : 0,
        brushing_uBrushTarget: brushTarget ? 1 : 0,
        brushing_uBrushRadius: brushRadius,
        brushing_uEnableBrushing: enableBrushing ? 1 : 0,
        brushing_uStrokeScale: strokeScale,
        brushing_uMousePosition: mousePosition
          ? new Float32Array(this.unproject(mousePosition))
          : defaultProps.mousePosition
      }
    });
  }
}

ArcBrushingLayer.layerName = 'ArcBrushingLayer';
ArcBrushingLayer.defaultProps = defaultProps;
