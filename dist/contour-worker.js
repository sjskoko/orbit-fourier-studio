importScripts('contours.js');
self.onmessage=({data})=>{try{const result=Contour.process(new Uint8ClampedArray(data.rgba),data.width,data.height,data.options);self.postMessage({id:data.id,result},[result.mask.buffer]);}catch(error){self.postMessage({id:data.id,error:error.message});}};
