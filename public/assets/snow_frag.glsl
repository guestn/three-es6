
glEnable(GL_POINT_SPRITE) and glEnable(GL_VERTEX_PROGRAM_POINT_SIZE)
uniform vec3 color;
uniform float opacity;
uniform sampler2D texture;

void main() {
  vec4 texColor = texture2D( texture, gl_PointCoord );
  //vec4 texColor = vec4(1.0,0.,0.,1.);
  gl_FragColor = texColor * vec4( color, opacity );
}