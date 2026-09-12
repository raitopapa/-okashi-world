const LINES={
  house:['おうちの できあがり！','すてきな おうちが たったね！','きみだけの おうちだね！','みんなで おいわいしよう！'],
  cookie:['れんがが できた！','こんがり おいしそう！','かべの ざいりょう、できあがり！','クッキーを はこぼう！'],
  chocolate:['チョコが なめらかに なったね！','つやつや チョコのできあがり！','やねの じゅんびが できたよ！','とろり、おいしそう！'],
  catch:['ざいりょうが そろったね！','かごが いっぱい！','これで おうちを かざれるね！','じょうずに はこべたね！'],
  oven:['ふっくら やけたね！','こんがり、できあがり！','いい においが しそうだね！','おいしい どだいの できあがり！'],
};
// Only explicit completion events have lines. Never queue late praise.
export class CelebrationCues{
  constructor(){this.lastAt=-Infinity;this.indices={};}
  next(kind,now){
    const lines=LINES[kind];if(!lines||now-this.lastAt<25000)return null;
    const index=((this.indices[kind]??-1)+1)%lines.length;
    this.indices[kind]=index;this.lastAt=now;return lines[index];
  }
}
