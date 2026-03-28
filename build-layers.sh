echo "🧹 Clean the workspace"
rm -rf layers/sharp

echo "📁 Create sharping directory"
mkdir -p layers/sharp/nodejs

echo "🚀 Install sharp in the layer"

SHARP_VERSION=$(node -e "console.log(require('./package.json').dependencies.sharp)")

cd layers/sharp/nodejs

npm init -y

npm i --cpu=arm64 --os=linux --libc=glibc sharp@"$SHARP_VERSION"

rm -rf package.json package-lock.json

echo "✅ Done"