exports.fragmentShader = `
      precision mediump float;
      uniform sampler2D texture;
      uniform sampler2D colorlut;
      uniform vec3 color;
      uniform float videowidth;
      uniform float videoheight;
      uniform int filterType;
      uniform float gridSize;
      uniform float lightLevel;

      varying vec2 vUv;
      float alter=3.0;
      float u_mode=0.0;
      float u_threshold=1.0;
      float u_clipBlack=0.5;
      float u_clipWhite=1.0;

      float rgb2cb(float r, float g, float b){
      	return 0.5 + -0.168736*r - 0.331264*g + 0.5*b;
      }
      float rgb2cr(float r, float g, float b){
      	return 0.5 + 0.5*r - 0.418688*g - 0.081312*b;
      }
      float smoothclip(float low, float high, float x){
      	if (x <= low){
      		return 0.0;
      	}
      	if(x >= high){
      		return 1.0;
      	}
      	return (x-low)/(high-low);
      }
      vec4 greenscreen(vec4 colora, float Cb_key,float Cr_key, float tola,float tolb, float clipBlack, float clipWhite){
      	float cb = rgb2cb(colora.r,colora.g,colora.b);
      	float cr = rgb2cr(colora.r,colora.g,colora.b);
      	float alpha = distance(vec2(cb, cr), vec2(Cb_key, Cr_key));
      	alpha = smoothclip(tola, tolb, alpha);
      	float r = max(gl_FragColor.r - (1.0-alpha)*color.r, 0.0);
      	float g = max(gl_FragColor.g - (1.0-alpha)*color.g, 0.0);
      	float b = max(gl_FragColor.b - (1.0-alpha)*color.b, 0.0);
      	if(alpha < clipBlack){
      		alpha = r = g = b = 0.0;
      	}
      	if(alpha > clipWhite){
      		alpha = 1.0;
      	}
      	if(clipWhite < 1.0){
      		alpha = alpha/max(clipWhite, 0.9);
      	}
      	return vec4(r,g,b, alpha);
      }

      void main()
      {
      	gl_FragColor = texture2D( texture, vUv );
      	//Greenscreen
      	float tola = 0.0;
      	float tolb = u_threshold/2.0;
      	float cb_key = rgb2cb(color.r, color.g, color.b);
      	float cr_key = rgb2cr(color.r, color.g, color.b);
      	gl_FragColor = greenscreen(gl_FragColor, cb_key, cr_key, tola, tolb, u_clipBlack, u_clipWhite);
      	if(u_mode > 0.5 && u_mode < 1.5){
      			gl_FragColor = mix(vec4(1.0, 1.0, 1.0, 1.0), gl_FragColor, gl_FragColor.a);
      			gl_FragColor.a = 1.0;
      	}
      	if(u_mode > 1.5 && u_mode < 2.5){
      			gl_FragColor = vec4(gl_FragColor.a, gl_FragColor.a, gl_FragColor.a, 1.0);
      	}
      	if(filterType==1){
      		//灰阶
      		float gray = 0.2989*gl_FragColor.r+0.5870*gl_FragColor.g+0.1140*gl_FragColor.b;
      		gl_FragColor = vec4(gray,gray,gray , gl_FragColor.a);
      	}else if(filterType==2){
      		//模糊
      		vec3 tColor2 = texture2D( texture, vec2(vUv[0]+(1.0/videowidth) , vUv[1]) ).rgb;
      		vec3 tColor3 = texture2D( texture, vec2(vUv[0]-(1.0/videowidth) , vUv[1]) ).rgb;
      		vec3 tColor4 = texture2D( texture, vec2(vUv[0]+(1.0/videowidth) , vUv[1]+(1.0/videoheight)) ).rgb;
      		vec3 tColor5 = texture2D( texture, vec2(vUv[0]-(1.0/videowidth) , vUv[1]-(1.0/videoheight)) ).rgb;
      		vec3 tColor6 = texture2D( texture, vec2(vUv[0]+(1.0/videowidth) , vUv[1]-(1.0/videoheight)) ).rgb;
      		vec3 tColor7 = texture2D( texture, vec2(vUv[0]-(1.0/videowidth) , vUv[1]+(1.0/videoheight)) ).rgb;
      		vec3 tColor8 = texture2D( texture, vec2(vUv[0] , vUv[1]+(1.0/videoheight)) ).rgb;
      		vec3 tColor9 = texture2D( texture, vec2(vUv[0] , vUv[1]+(1.0/videoheight)) ).rgb;
      		vec3 tColor10 = texture2D( texture, vec2(vUv[0]+(2.0/videowidth) , vUv[1]) ).rgb;
      		vec3 tColor11 = texture2D( texture, vec2(vUv[0]+(2.0/videowidth) , vUv[1]) ).rgb;
      		gl_FragColor = vec4( (gl_FragColor.r+tColor2[0]+tColor3[0]+tColor4[0]+tColor5[0]+tColor6[0]+tColor7[0]+tColor8[0]+tColor9[0]+tColor10[0]+tColor11[0])/11.0,
      		(gl_FragColor.g+tColor2[1]+tColor3[1]+tColor4[1]+tColor5[1]+tColor6[1]+tColor7[1]+tColor8[1]+tColor9[1]+tColor10[1]+tColor11[1])/11.0,
      		(gl_FragColor.b+tColor2[2]+tColor3[2]+tColor4[2]+tColor5[2]+tColor6[2]+tColor7[2]+tColor8[2]+tColor9[2]+tColor10[2]+tColor11[2])/11.0,
      		gl_FragColor.a);
      	}else if(filterType==3){
           // 变亮
      		float brightr=gl_FragColor.r+lightLevel;
      		float brightg=gl_FragColor.g+lightLevel;
      		float brightb=gl_FragColor.b+lightLevel;
      		gl_FragColor = vec4(brightr,brightg,brightb , gl_FragColor.a);
      	}else if(filterType==4){
           // 反像素
      		float reverser=1.0 - gl_FragColor.r;
      		float reverseg=1.0 - gl_FragColor.g;
      		float reverseb=1.0 - gl_FragColor.b;
      		gl_FragColor = vec4(reverser,reverseg,reverseb,gl_FragColor.a);
      	}else if(filterType==5){
      		// 噪点
      		float dx = fract(sin(dot(vUv ,vec2(12.9898,78.233))) * 43758.5453);
      		vec3 cResult = gl_FragColor.rgb + gl_FragColor.rgb * clamp( 0.1 + dx, 0.0, 1.0 );
      		vec2 sc = vec2( sin( vUv.y * 4096.0 ), cos( vUv.y * 4096.0 ) );
      		cResult += gl_FragColor.rgb * vec3( sc.x, sc.y, sc.x ) * 0.025;
      		cResult = gl_FragColor.rgb + clamp( 0.35, 0.0,1.0 ) * ( cResult - gl_FragColor.rgb );
      		if( false ) {
      			cResult = vec3( cResult.r * 0.3 + cResult.g * 0.59 + cResult.b * 0.11 );
      		}
      		float oldr=0.393*cResult[0]+0.769*cResult[1]+0.189*cResult[2];
      		float oldg=0.349*cResult[0]+0.686*cResult[1]+0.168*cResult[2];
      		float oldb=0.272*cResult[0]+0.534*cResult[1]+0.131*cResult[2];
      		gl_FragColor =  vec4( oldr,oldg,oldb , gl_FragColor.a);
      	}else if(filterType==6){
           //网点
      		float average = ( gl_FragColor.r + gl_FragColor.g + gl_FragColor.b ) / 2.0;
      		float s = sin( 0.5 ), c = cos( 0.5 );
      		vec2 tex = vUv * vec2(videowidth,videoheight) - vec2(0,0);
      		vec2 point = vec2( c * tex.x - s * tex.y, s * tex.x + c * tex.y ) * gridSize;
      		float pattern =  ( sin( point.x ) * sin( point.y ) ) * 4.0;
      		float seed = average * 10.0 - 5.0 + pattern ;
      		gl_FragColor = vec4(  seed*0.3+gl_FragColor.r*0.7,seed*0.3+gl_FragColor.g*0.7 ,seed*0.3+gl_FragColor.b*0.7, gl_FragColor.a );
      	}
      }
    `;
