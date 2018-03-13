#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;

varying vec4 worldNormal; // custom from vert shader

// snow direction v3
vec3 snowDir = vec3(0,1,0);
// snowDepth
float snowDepth = 0.1;
float overlap = 1.2; //percentage overlap


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
////// <normalmap_pars_fragment> //////
//#include <normalmap_pars_fragment> ::::
// #ifdef USE_NORMALMAP
// 	uniform sampler2D normalMap;
// 	uniform vec2 normalScale;
// 	vec3 perturbNormal2Arb( vec3 eye_pos, vec3 surf_norm ) {
// 		vec3 q0 = vec3( dFdx( eye_pos.x ), dFdx( eye_pos.y ), dFdx( eye_pos.z ) );
// 		vec3 q1 = vec3( dFdy( eye_pos.x ), dFdy( eye_pos.y ), dFdy( eye_pos.z ) );
// 		vec2 st0 = dFdx( vUv.st );
// 		vec2 st1 = dFdy( vUv.st );
// 		vec3 S = normalize( q0 * st1.t - q1 * st0.t );
// 		vec3 T = normalize( -q0 * st1.s + q1 * st0.s );
// 		vec3 N = normalize( surf_norm );
// 		vec3 mapN = texture2D( normalMap, vUv ).xyz * 2.0 - 1.0;
// 		mapN.xy = normalScale * mapN.xy;
// 		mat3 tsn = mat3( S, T, N );
// 		return normalize( tsn * mapN );
// 	}
// #endif


#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform sampler2D snowNormalMap;
	uniform vec2 normalScale;
	uniform vec2 snowNormalScale;

	vec3 perturbNormal2Arb( vec3 eye_pos, vec3 surf_norm ) {
		vec3 q0 = vec3( dFdx( eye_pos.x ), dFdx( eye_pos.y ), dFdx( eye_pos.z ) );
		vec3 q1 = vec3( dFdy( eye_pos.x ), dFdy( eye_pos.y ), dFdy( eye_pos.z ) );
		vec2 st0 = dFdx( vUv.st );
		vec2 st1 = dFdy( vUv.st );
		vec3 S = normalize( q0 * st1.t - q1 * st0.t );
		vec3 T = normalize( -q0 * st1.s + q1 * st0.s );
		vec3 N = normalize( surf_norm );
		vec3 mapN = texture2D( normalMap, vUv ).xyz * 2.0 - 1.0;

		vec3 mapN2 = texture2D( snowNormalMap, vUv ).xyz * 2.0 - 1.0;

		mapN = vec3(smoothstep(-(snowDepth * overlap), -snowDepth, - dot(worldNormal.xyz, snowDir))) * mapN;
		mapN2 = vec3(smoothstep(snowDepth, snowDepth * overlap, dot(worldNormal.xyz, snowDir))) * mapN2;
		
		mapN.xy = normalScale * mapN.xy;
		mapN2.xy = snowNormalScale * mapN2.xy;

		vec3 mapNFinal = mix(mapN * 2.0, mapN2 * 2.0, 0.5);

		mat3 tsn = mat3( S, T, N );
		return normalize( tsn * mapNFinal );
	}
#endif

#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>


void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity ); // orig
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) ); // orig
	vec3 totalEmissiveRadiance = emissive; // orig
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	vec2 posn = -1. + 2.0 * vUv;

	// random number
	float random = fract(sin(dot(posn, vec2(12.9898, 78.233))) * 43758.5453) * 0.1;

	// get snow on top
	vec3 snowColor = vec3(smoothstep(snowDepth, snowDepth * overlap + random, dot(worldNormal.xyz, snowDir)));

	// get other color on bottom
	vec3 mainColor = vec3(smoothstep(-(snowDepth * overlap + random), -snowDepth, - dot(worldNormal.xyz, snowDir))) * diffuseColor.rgb;

	// mix the two colors
	diffuseColor.rgb = mix(snowColor * 2.0, mainColor * 2.0, 0.5);

//// <color_fragment> /////
	#include <color_fragment>

	//#include <alphamap_fragment>
	//#include <alphatest_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_template>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;  // orig
	//#include <envmap_fragment>

	gl_FragColor = vec4( outgoingLight, diffuseColor.a );  // orig
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}