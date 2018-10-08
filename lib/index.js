const fs = require('fs');
const args = require('args');
const path = require('path');
const util = require('util');
const Jimp = require('jimp');
const icongen = require('icon-gen');

const fsExists = util.promisify(fs.exists);
const fsMkdir = util.promisify(fs.mkdir);

const sizes = [16, 24, 32, 48, 64, 128, 256, 512, 1024];

const iconOptions = {
  type: 'png',
  names: {
    icns: 'icon',
    ico: 'icon'
  }
};

args
  .option('input', 'Input PNG file (recommended size: 1024 x 1024)', './icon.png')
  .option('output', 'The output folder for the generated icons', './icons')

const flags = args.parse(process.argv);

const inputFile = path.resolve(process.cwd(), flags.input);
const outputDir = path.resolve(process.cwd(), flags.output);

if(!inputFile.endsWith('.png')) {
  throw new Error('Please specify an png file as input file!');
}

const outputDirs = {
  png: path.resolve(outputDir, 'pngs'),
  icns: path.resolve(outputDir, 'mac'),
  ico: path.resolve(outputDir, 'win')
};

execute();

/**
 * Executes the utility
 */
async function execute() {
  await createOuputDirs();

  // Create correct png sizes
  await asyncForEach(sizes, async size => {
    await createResizedPNG(size);
  });

  await generateIcon('icns');
  await generateIcon('ico');
}

/**
 * Creates the needed output directories
 */
async function createOuputDirs() {
  try {
    console.log(`[INFO]: Checking directories`);
    const outputExists = await fsExists(outputDir);
    if(!outputExists) {
      await fsMkdir(outputDir);
    }

    await asyncForEach(outputDirs, async dir => {
      const dirExists = await fsExists(dir);
      if(!dirExists) {
        await fsMkdir(dir);
      }
    });
    console.log(`[INFO]: Successfully created all output directories`);
  } catch(e) {
    console.log(`[ERROR]: An unexpected error occured while creating the output directories`, e);
    process.exit(1);
  }
}

/**
 * Resizes the inputPNG to the specified size
 * @param {number} size The size to resize to
 */
async function createResizedPNG(size) {
  try {
    const fileName = `${size}.png`;
    const image = await Jimp.read(inputFile);

    await new Promise((resolve, reject) => {
      image
        .resize(size, size)
        .write(path.resolve(outputDirs.png, fileName), (err) => {
          if(err) return reject(err);

          resolve();
        });
    });
    console.log(`[INFO]: Successfully resized png (${size}x${size})`);
  } catch(e) {
    console.log(`[ERROR]: An unexpected error occured while resizing png (${size}x${size})`, e);
    process.exit(1);
  }
}

/**
 * Generates the specified icon type
 * @param {string} type The icon type (ico, icns)
 */
async function generateIcon(type) {
  try {
    await icongen(outputDirs.png, outputDirs[type], { ...iconOptions, modes: [type] });
    console.log(`[INFO]: Successfully created the '${type}' icon type`);
  } catch(e) {
    console.log(`[ERROR]: An unexpected error occured while generating the '${type}' icon type`, e);
    process.exit(1);
  }
}
/**
 * A little helper function for executing async callbacks in a foreach
 * @param {any[]} array An array
 * @param {Promise<Function>} callback The async callbacks
 */
async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}