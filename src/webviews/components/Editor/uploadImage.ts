async function resizeImageFile(
  file: File,
  maxSizeInBytes: number
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = document.createElement("img");
    const canvas = document.createElement("canvas");
    const reader = new FileReader();

    reader.onload = (e) => {
      if (!e.target?.result) {
        return reject("Failed to read file");
      }

      img.src = e.target.result as string;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        const scaleFactor = Math.sqrt(maxSizeInBytes / file.size);

        if (scaleFactor < 1) {
          width = Math.floor(width * scaleFactor);
          height = Math.floor(height * scaleFactor);
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return reject("Failed to get canvas context");
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return reject("Failed to convert canvas to blob");
            }
            const resizedFile = new File([blob], file.name, {
              type: file.type,
            });
            resolve(resizedFile);
          },
          file.type,
          0.9
        );
      };

      img.onerror = () => {
        reject("Failed to load image");
      };
    };

    reader.onerror = () => {
      reject("Failed to read file");
    };

    reader.readAsDataURL(file);
  });
}

export async function getImageFileToBase64(
  file: File,
  maxSizeInBytes: number
): Promise<string> {
  let fileToUse = file;

  if (file.size > maxSizeInBytes) {
    fileToUse = await resizeImageFile(file, maxSizeInBytes);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(fileToUse);
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject("Failed to convert file to base64");
      }
    };
    reader.onerror = (error) => reject(error);
  });
}
