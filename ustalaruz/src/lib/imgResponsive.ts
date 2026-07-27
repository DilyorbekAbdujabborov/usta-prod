const U = 'images.unsplash.com';

function isUnsplash(url: string) {
  return url.includes(U);
}

export function responsiveImgProps(
  url: string,
  widths = [200, 400, 600, 800],
  defaultWidth = 400
) {
  if (!isUnsplash(url)) return { src: url, srcSet: undefined };
  const base = url.replace(/\?w=\d+/, '').replace(/\?q=\d+/, '');
  return {
    src: `${base}?w=${defaultWidth}&q=80`,
    srcSet: widths.map(w => `${base}?w=${w}&q=75 ${w}w`).join(', '),
  };
}

export function responsiveCategoryImgProps(url: string) {
  return responsiveImgProps(url, [200, 400, 600, 800], 400);
}

export function responsiveAvatarImgProps(url: string) {
  return responsiveImgProps(url, [100, 200, 300, 400], 200);
}
