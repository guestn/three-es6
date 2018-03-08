#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;

varying vec4 wNormal;

#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <uv2_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	vec2 posn = -1. + 2.0 * vUv;

	// random number
	float rand = fract(sin(dot(posn, vec2(12.9898, 78.233))) * 43758.5453) * 0.1;

	// snow direction v3
	vec3 snowDir = vec3(0,1,0);

	// get snow on top
	vec3 snowColor = vec3(smoothstep(0.1, 0.12 + rand, dot(wNormal.xyz, snowDir)));

	// get other color on bottom
	vec3 mainColor = vec3(smoothstep(-(0.12 + rand), -0.1, - dot(wNormal.xyz, snowDir))) * diffuseColor.rgb;

	//diffuseColor.rgb = vec3(smoothstep(0.1, 0.15, dot(wNormal.xyz, snowDir)));
	// mix the two colors
	diffuseColor.rgb = mix(snowColor * 2.0, mainColor * 2., 0.5);

//// <color_fragment> /////
	#include <color_fragment>

	//#include <alphamap_fragment>
	//#include <alphatest_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment>
	#include <emissivemap_fragment>
	//diffuseColor = smoothstep(0.2,0.25, diffuseColor);

	#include <lights_phong_fragment>
	#include <lights_template>
	//#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	//#include <envmap_fragment>
			//vec2 posn = -1. + 2.0 * vUv;

	//outgoingLight = smoothstep(0.5,0.55, outgoingLight);
	//float snow = smoothstep(1.0, 1.0, posn.y);
	vec3 color = outgoingLight;//mix(vec3(snow), outgoingLight, 1.0);
	gl_FragColor = vec4( color, diffuseColor.a );
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}