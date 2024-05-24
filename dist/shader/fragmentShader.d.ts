declare const _default: "\n      precision mediump float;\n      uniform sampler2D pointTexture;\n      uniform sampler2D colorlut;\n      uniform vec3 color;\n      uniform float videowidth;\n      uniform float videoheight;\n      uniform int filterType;\n      uniform float gridSize;\n      uniform float lightLevel;\n\n      varying vec2 vUv;\n      float alter=3.0;\n      float u_mode=0.0;\n      float u_threshold=1.0;\n      float u_clipBlack=0.5;\n      float u_clipWhite=1.0;\n\n      float rgb2cb(float r, float g, float b){\n      \treturn 0.5 + -0.168736*r - 0.331264*g + 0.5*b;\n      }\n      float rgb2cr(float r, float g, float b){\n      \treturn 0.5 + 0.5*r - 0.418688*g - 0.081312*b;\n      }\n      float smoothclip(float low, float high, float x){\n      \tif (x <= low){\n      \t\treturn 0.0;\n      \t}\n      \tif(x >= high){\n      \t\treturn 1.0;\n      \t}\n      \treturn (x-low)/(high-low);\n      }\n      vec4 greenscreen(vec4 colora, float Cb_key,float Cr_key, float tola,float tolb, float clipBlack, float clipWhite){\n      \tfloat cb = rgb2cb(colora.r,colora.g,colora.b);\n      \tfloat cr = rgb2cr(colora.r,colora.g,colora.b);\n      \tfloat alpha = distance(vec2(cb, cr), vec2(Cb_key, Cr_key));\n      \talpha = smoothclip(tola, tolb, alpha);\n      \tfloat r = max(gl_FragColor.r - (1.0-alpha)*color.r, 0.0);\n      \tfloat g = max(gl_FragColor.g - (1.0-alpha)*color.g, 0.0);\n      \tfloat b = max(gl_FragColor.b - (1.0-alpha)*color.b, 0.0);\n      \tif(alpha < clipBlack){\n      \t\talpha = r = g = b = 0.0;\n      \t}\n      \tif(alpha > clipWhite){\n      \t\talpha = 1.0;\n      \t}\n      \tif(clipWhite < 1.0){\n      \t\talpha = alpha/max(clipWhite, 0.9);\n      \t}\n      \treturn vec4(r,g,b, alpha);\n      }\n\n      void main()\n      {\n      \tgl_FragColor = texture2D( pointTexture, vUv );\n      \t//Greenscreen\n      \tfloat tola = 0.0;\n      \tfloat tolb = u_threshold/2.0;\n      \tfloat cb_key = rgb2cb(color.r, color.g, color.b);\n      \tfloat cr_key = rgb2cr(color.r, color.g, color.b);\n      \tgl_FragColor = greenscreen(gl_FragColor, cb_key, cr_key, tola, tolb, u_clipBlack, u_clipWhite);\n      \tif(u_mode > 0.5 && u_mode < 1.5){\n      \t\t\tgl_FragColor = mix(vec4(1.0, 1.0, 1.0, 1.0), gl_FragColor, gl_FragColor.a);\n      \t\t\tgl_FragColor.a = 1.0;\n      \t}\n      \tif(u_mode > 1.5 && u_mode < 2.5){\n      \t\t\tgl_FragColor = vec4(gl_FragColor.a, gl_FragColor.a, gl_FragColor.a, 1.0);\n      \t}\n      \tif(filterType==1){\n      \t\t//灰阶\n      \t\tfloat gray = 0.2989*gl_FragColor.r+0.5870*gl_FragColor.g+0.1140*gl_FragColor.b;\n      \t\tgl_FragColor = vec4(gray,gray,gray , gl_FragColor.a);\n      \t}else if(filterType==2){\n      \t\t//模糊\n      \t\tvec3 tColor2 = texture2D( pointTexture, vec2(vUv[0]+(1.0/videowidth) , vUv[1]) ).rgb;\n      \t\tvec3 tColor3 = texture2D( pointTexture, vec2(vUv[0]-(1.0/videowidth) , vUv[1]) ).rgb;\n      \t\tvec3 tColor4 = texture2D( pointTexture, vec2(vUv[0]+(1.0/videowidth) , vUv[1]+(1.0/videoheight)) ).rgb;\n      \t\tvec3 tColor5 = texture2D( pointTexture, vec2(vUv[0]-(1.0/videowidth) , vUv[1]-(1.0/videoheight)) ).rgb;\n      \t\tvec3 tColor6 = texture2D( pointTexture, vec2(vUv[0]+(1.0/videowidth) , vUv[1]-(1.0/videoheight)) ).rgb;\n      \t\tvec3 tColor7 = texture2D( pointTexture, vec2(vUv[0]-(1.0/videowidth) , vUv[1]+(1.0/videoheight)) ).rgb;\n      \t\tvec3 tColor8 = texture2D( pointTexture, vec2(vUv[0] , vUv[1]+(1.0/videoheight)) ).rgb;\n      \t\tvec3 tColor9 = texture2D( pointTexture, vec2(vUv[0] , vUv[1]+(1.0/videoheight)) ).rgb;\n      \t\tvec3 tColor10 = texture2D( pointTexture, vec2(vUv[0]+(2.0/videowidth) , vUv[1]) ).rgb;\n      \t\tvec3 tColor11 = texture2D( pointTexture, vec2(vUv[0]+(2.0/videowidth) , vUv[1]) ).rgb;\n      \t\tgl_FragColor = vec4( (gl_FragColor.r+tColor2[0]+tColor3[0]+tColor4[0]+tColor5[0]+tColor6[0]+tColor7[0]+tColor8[0]+tColor9[0]+tColor10[0]+tColor11[0])/11.0,\n      \t\t(gl_FragColor.g+tColor2[1]+tColor3[1]+tColor4[1]+tColor5[1]+tColor6[1]+tColor7[1]+tColor8[1]+tColor9[1]+tColor10[1]+tColor11[1])/11.0,\n      \t\t(gl_FragColor.b+tColor2[2]+tColor3[2]+tColor4[2]+tColor5[2]+tColor6[2]+tColor7[2]+tColor8[2]+tColor9[2]+tColor10[2]+tColor11[2])/11.0,\n      \t\tgl_FragColor.a);\n      \t}else if(filterType==3){\n           // 变亮\n      \t\tfloat brightr=gl_FragColor.r+lightLevel;\n      \t\tfloat brightg=gl_FragColor.g+lightLevel;\n      \t\tfloat brightb=gl_FragColor.b+lightLevel;\n      \t\tgl_FragColor = vec4(brightr,brightg,brightb , gl_FragColor.a);\n      \t}else if(filterType==4){\n           // 反像素\n      \t\tfloat reverser=1.0 - gl_FragColor.r;\n      \t\tfloat reverseg=1.0 - gl_FragColor.g;\n      \t\tfloat reverseb=1.0 - gl_FragColor.b;\n      \t\tgl_FragColor = vec4(reverser,reverseg,reverseb,gl_FragColor.a);\n      \t}else if(filterType==5){\n      \t\t// 噪点\n      \t\tfloat dx = fract(sin(dot(vUv ,vec2(12.9898,78.233))) * 43758.5453);\n      \t\tvec3 cResult = gl_FragColor.rgb + gl_FragColor.rgb * clamp( 0.1 + dx, 0.0, 1.0 );\n      \t\tvec2 sc = vec2( sin( vUv.y * 4096.0 ), cos( vUv.y * 4096.0 ) );\n      \t\tcResult += gl_FragColor.rgb * vec3( sc.x, sc.y, sc.x ) * 0.025;\n      \t\tcResult = gl_FragColor.rgb + clamp( 0.35, 0.0,1.0 ) * ( cResult - gl_FragColor.rgb );\n      \t\tif( false ) {\n      \t\t\tcResult = vec3( cResult.r * 0.3 + cResult.g * 0.59 + cResult.b * 0.11 );\n      \t\t}\n      \t\tfloat oldr=0.393*cResult[0]+0.769*cResult[1]+0.189*cResult[2];\n      \t\tfloat oldg=0.349*cResult[0]+0.686*cResult[1]+0.168*cResult[2];\n      \t\tfloat oldb=0.272*cResult[0]+0.534*cResult[1]+0.131*cResult[2];\n      \t\tgl_FragColor =  vec4( oldr,oldg,oldb , gl_FragColor.a);\n      \t}else if(filterType==6){\n           //网点\n      \t\tfloat average = ( gl_FragColor.r + gl_FragColor.g + gl_FragColor.b ) / 2.0;\n      \t\tfloat s = sin( 0.5 ), c = cos( 0.5 );\n      \t\tvec2 tex = vUv * vec2(videowidth,videoheight) - vec2(0,0);\n      \t\tvec2 point = vec2( c * tex.x - s * tex.y, s * tex.x + c * tex.y ) * gridSize;\n      \t\tfloat pattern =  ( sin( point.x ) * sin( point.y ) ) * 4.0;\n      \t\tfloat seed = average * 10.0 - 5.0 + pattern ;\n      \t\tgl_FragColor = vec4(  seed*0.3+gl_FragColor.r*0.7,seed*0.3+gl_FragColor.g*0.7 ,seed*0.3+gl_FragColor.b*0.7, gl_FragColor.a );\n      \t}\n      }\n    ";
export default _default;