import { api } from '.';
import { useProgressStore } from '../store/progress.store';
import { getFileInfoData, getFolderInfoData, ReadFolderData } from '../types/response';
import { cloudUrls } from './urls';

export const checkUser = async () => {
  const checkUser = cloudUrls.user.checkUser;
  const response = await api.request({
    method: checkUser.method,
    url: checkUser.url,
  });
  return response;
};

export const enrollUser = async () => {
  const createUser = cloudUrls.user.enrollUser;
  const response = await api.request({
    method: createUser.method,
    url: createUser.url,
  });
  return response;
};

export const deleteUser = async () => {
  const deleteUser = cloudUrls.user.deleteUser;
  const response = await api.request({
    method: deleteUser.method,
    url: deleteUser.url,
  });
  return response;
};

export const createRootFolder = async () => {
  const createRootFolder = cloudUrls.folder.createRootFolder;
  const response = await api.request<string>({
    method: createRootFolder.method,
    url: createRootFolder.url,
  });
  return response;
};

export const createFolder = async (
  folderKey: string,
  folderName: string
) => {
  const createFolder = cloudUrls.folder.createFolder(folderKey);
  const response = await api.request<string>({
    method: createFolder.method,
    url: createFolder.url,
    data: {
      folderName: folderName,
    },
  });
  return response;
};

export const readFolder = async (folderKey: string) => {
  const readFolder = cloudUrls.folder.readFolder(folderKey);
  const response = await api.request<ReadFolderData>({
    method: readFolder.method,
    url: readFolder.url,
  });
  return response;
};

export const getRootFolderKey = async () => {
  const getRootFolderKey = cloudUrls.folder.getRootFolderKey;
  const response = await api.request<string>({
    method: getRootFolderKey.method,
    url: getRootFolderKey.url,
  });
  return response;
};

export const deleteFolder = async (folderKey: string) => {
  const deleteFolder = cloudUrls.folder.deleteFolder(folderKey);
  const response = await api.request({
    method: deleteFolder.method,
    url: deleteFolder.url,
  });
  return response;
};

export const moveFolder = async (
  folderKey: string,
  targetKey: string
) => {
  const moveFolder = cloudUrls.folder.moveFolder(folderKey, targetKey);
  const response = await api.request({
    method: moveFolder.method,
    url: moveFolder.url,
  });
  return response;
};

export const renameFolder = async (
  folderKey: string,
  folderName: string
) => {
  const renameFolder = cloudUrls.folder.renameFolder(folderKey);
  const response = await api.request({
    method: renameFolder.method,
    url: renameFolder.url,
    data: {
      folderName: folderName,
    },
  });
  return response;
};

export const getFolderInfo = async (folderKey: string) => {
  const getFolderInfo = cloudUrls.folder.info(folderKey);
  const response = await api.request<getFolderInfoData>({
    method: getFolderInfo.method,
    url: getFolderInfo.url,
  });
  return response;
}

export const getFolderPath = async (folderKey: string) => {
  const getFolderPath = cloudUrls.folder.path(folderKey);
  const response = await api.request<string[]>({
    method: getFolderPath.method,
    url: getFolderPath.url,
  });
  return response;
}

export const uploadChunk = async (
  folderKey: string,
  chunk: File | Blob,
  fileName: string,
  totalChunks: number,
  chunkNumber: number
) => {
  const uploadFile = cloudUrls.file.uploadFile(folderKey);
  const formData = new FormData();
  formData.append('file', chunk, fileName);
  formData.append('fileName', fileName);
  formData.append('totalChunks', totalChunks.toString());
  formData.append('chunkNumber', chunkNumber.toString());

  const response = api
    .request({
      method: uploadFile.method,
      url: uploadFile.url,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      data: formData,
      onUploadProgress: (event) => {
        const progressName = `${folderKey}-${fileName}`;
        useProgressStore.getState().updateProgress({
          key: progressName,
          loaded: event.loaded + chunkNumber * chunk.size,
          total: chunk.size * totalChunks,
        });
      },
      
    })
    .catch((error) => {
      useProgressStore.getState().removeProgress(`${folderKey}-${fileName}`);
      return Promise.reject(error);
    });
  return response;
};

export const downloadFile = async (
  fileKey: string,
  progressName?: string
) => {
  if (progressName) {
    useProgressStore.getState().addProgress({
      key: fileKey,
      name: progressName,
      type: 'download',
    });
  }
  const downloadFile = cloudUrls.file.downloadFile(fileKey);
  const response = api
    .request<Blob>({
      method: downloadFile.method,
      url: downloadFile.url,
      responseType: 'blob',
      onDownloadProgress: (event) => {
        if (progressName) {
          useProgressStore.getState().updateProgress({
            key: fileKey,
            loaded: event.loaded,
            total: event.total ?? 0,
          });
        }
      },
    })
    .then((response) => {
      useProgressStore.getState().removeProgress(fileKey);
      return response;
    })
    .catch((error) => {
      useProgressStore.getState().removeProgress(fileKey);
      return Promise.reject(error);
    });
  return response;
};

export const deleteFile = async (
  fileKey: string
) => {
  const deleteFile = cloudUrls.file.deleteFile(fileKey);
  const response = await api.request({
    method: deleteFile.method,
    url: deleteFile.url,
  });
  return response;
};

export const renameFile = async (
  fileKey: string,
  fileName: string
) => {
  const renameFile = cloudUrls.file.renameFile(fileKey);
  const response = await api.request({
    method: renameFile.method,
    url: renameFile.url,
    data: {
      fileName: fileName,
    },
  });
  return response;
};

export const moveFile = async (
  fileKey: string,
  newFolderKey: string
) => {
  const moveFile = cloudUrls.file.moveFile(fileKey, newFolderKey);
  const response = await api.request({
    method: moveFile.method,
    url: moveFile.url,
  });
  return response;
};

export const getFileInfo = async (fileKey: string) => {
  const getFileInfo = cloudUrls.file.getFileInfo(fileKey);
  const response = await api.request<getFileInfoData>({
    method: getFileInfo.method,
    url: getFileInfo.url,
  });
  return response;
}