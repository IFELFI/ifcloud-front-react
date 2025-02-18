import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import MenuList from "./menu_list";
import { useWindowStore } from "@/store/window.store";
import { fileQuery, storageQuery } from "@/api/query";
import { useCallback } from "react";
import { WindowType } from "@/interfaces/window";
import { FileType } from "@/interfaces/file";
import { useFileStore } from "@/store/file.store";
import { ContentTypes, getContentTypes } from "@/utils/content_types";
import { url } from "@/api/fetch";

export default function FileMenu({
  fileKey,
  fileType,
  fileName,
  windowKey,
  parentWindowType,
  closeMenu,
}: {
  fileKey: string;
  fileType: FileType;
  fileName: string;
  windowKey: string;
  parentWindowType: WindowType | null;
  closeMenu: () => void;
}) {
  // Query client
  // This is used for actions
  // By using queryClient, the query will be performed only needed, instead of performing all queries for possible actions
  const queryClient = useQueryClient();

  // Queries
  const readLinkTargetQuery = useQuery({
    ...fileQuery.read.linkTarget(fileKey),
    enabled: fileType === FileType.Link,
  });

  // Mutations
  const moveToTrashMutation = useMutation(fileQuery.update.trash);
  const permanentDeleteMutation = useMutation(fileQuery.delete.permanent);

  // Store actions
  const newWindow = useWindowStore((state) => state.newWindow);
  const getSelectedFileKeys = useFileStore(
    (state) => state.getSelectedFileKeys,
  );
  const setRenamingFile = useFileStore((state) => state.setRenamingFile);

  const openFile = useCallback(
    async (
      fileType: Omit<FileType, FileType.Link>,
      fileName: string,
      fileKey: string,
    ) => {
      let windowType: WindowType;
      switch (fileType) {
        case FileType.Container:
        case FileType.Root:
        case FileType.Home:
        case FileType.Trash:
          windowType = WindowType.Navigator;
          break;
        case FileType.Block:
          const contentType = getContentTypes(fileName);
          switch (contentType) {
            case ContentTypes.Image:
              windowType = WindowType.Image;
              break;
            case ContentTypes.Video:
              windowType = WindowType.Video;
              break;
            case ContentTypes.Audio:
              windowType = WindowType.Audio;
              break;
            default:
              windowType = WindowType.Other;
              break;
          }
          break;
        case FileType.Upload:
          windowType = WindowType.Uploader;
          break;
        default:
          windowType = WindowType.Other;
          break;
      }
      newWindow({
        targetKey: fileKey,
        type: windowType,
        title: fileName,
      });
    },
    [newWindow],
  );

  // Open file action
  const handleOpen = useCallback(async () => {
    closeMenu();
    if (
      fileType === FileType.Link &&
      readLinkTargetQuery.isSuccess &&
      readLinkTargetQuery.data
    ) {
      openFile(
        readLinkTargetQuery.data.data.type,
        fileName,
        readLinkTargetQuery.data.data.fileKey,
      );
    } else {
      openFile(fileType, fileName, fileKey);
    }
  }, [
    closeMenu,
    fileKey,
    fileName,
    fileType,
    openFile,
    readLinkTargetQuery.data,
    readLinkTargetQuery.isSuccess,
  ]);

  // Open file location action
  const handleOpenLinkTargetLocation = useCallback(async () => {
    closeMenu();
    if (readLinkTargetQuery.isSuccess && readLinkTargetQuery.data) {
      const parent = await queryClient.fetchQuery(
        fileQuery.read.parent(readLinkTargetQuery.data.data.fileKey),
      );
      if (parent && parent.data) {
        newWindow({
          targetKey: parent.data.fileKey,
          type: WindowType.Navigator,
          title: parent.data.fileName,
        });
      }
    }
  }, [
    closeMenu,
    newWindow,
    queryClient,
    readLinkTargetQuery.data,
    readLinkTargetQuery.isSuccess,
  ]);

  // Update file actions
  const handleRename = useCallback(() => {
    closeMenu();
    setRenamingFile({ fileKey, windowKey });
  }, [closeMenu, fileKey, setRenamingFile, windowKey]);

  // Download file actions
  const handleDownload = useCallback(async () => {
    closeMenu();
    await queryClient.fetchQuery(storageQuery.session.read(fileKey));

    const downloadUrl = `${url.storage.file.readWithName(fileKey, fileName)}`;
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = fileName;
    a.click();
  }, [closeMenu, fileKey, fileName, queryClient]);

  // Delete file actions
  const handleMoveToTrash = useCallback(() => {
    closeMenu();
    const selectedFileKeys = getSelectedFileKeys();
    Promise.all(
      selectedFileKeys.map((fileKey) =>
        moveToTrashMutation.mutateAsync({ fileKey }),
      ),
    ).finally(() => {
      queryClient.invalidateQueries({
        queryKey: ["file"],
      });
    });
  }, [closeMenu, getSelectedFileKeys, moveToTrashMutation, queryClient]);

  const handlePermanentDelete = useCallback(() => {
    closeMenu();
    const selectedFileKeys = getSelectedFileKeys();
    Promise.all(
      selectedFileKeys.map((fileKey) =>
        permanentDeleteMutation.mutateAsync({ fileKey }),
      ),
    ).finally(() => {
      queryClient.invalidateQueries({
        queryKey: ["file"],
      });
    });
  }, [closeMenu, getSelectedFileKeys, permanentDeleteMutation, queryClient]);

  const handleEmptyTrash = useCallback(async () => {
    closeMenu();
    const files = await queryClient.fetchQuery(
      fileQuery.read.children(fileKey),
    );
    if (files) {
      Promise.all(
        files.data.map((file) =>
          permanentDeleteMutation.mutateAsync({ fileKey: file.fileKey }),
        ),
      ).then(() => {
        queryClient.invalidateQueries({
          queryKey: ["file", fileKey],
        });
      });
    }
  }, [closeMenu, fileKey, permanentDeleteMutation, queryClient]);

  // Delete file actions based on parent window type
  const deleteMenu =
    parentWindowType === WindowType.Trash
      ? { name: "Permanent Delete", action: handlePermanentDelete }
      : { name: "Move to Trash", action: handleMoveToTrash };

  switch (fileType) {
    case FileType.Container:
    case FileType.Root:
    case FileType.Home:
      return (
        <MenuList
          menuList={[
            { name: "Open", action: handleOpen },
            { name: "Rename", action: handleRename },
            { name: "/", action: () => {} },
            deleteMenu,
          ]}
        />
      );
    case FileType.Block:
      return (
        <MenuList
          menuList={[
            { name: "Open", action: handleOpen },
            { name: "Download", action: handleDownload },
            { name: "Rename", action: handleRename },
            { name: "/", action: () => {} },
            deleteMenu,
          ]}
        />
      );
    case FileType.Link:
      return (
        <MenuList
          menuList={[
            { name: "Open", action: handleOpen },
            {
              name: "Open Link Target Location",
              action: handleOpenLinkTargetLocation,
            },
            { name: "Rename", action: handleRename },
            { name: "/", action: () => {} },
            deleteMenu,
          ]}
        />
      );
    case FileType.Upload:
      return <MenuList menuList={[{ name: "Open", action: handleOpen }]} />;
    case FileType.Trash:
      return (
        <MenuList
          menuList={[{ name: "Empty Trash", action: handleEmptyTrash }]}
        />
      );
    default:
      return null;
  }
}
