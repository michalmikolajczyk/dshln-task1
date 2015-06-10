function getFavicon(req, res, next) {
  console.log(req);
  return res.send('protocol://path/');
}

exports.getFavicon = getFavicon;