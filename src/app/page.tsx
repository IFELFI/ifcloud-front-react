"use client";

import FileContainer from "@/components/file/file_container";
import styles from "./page.module.css";
import Background from "@/components/layout/background";
import Navbar from "@/components/layout/navbar/navbar_container";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useWindowStore } from "@/store/window.store";
import SelectBoxContainer from "@/components/select/select_box_container";
import DragFileContainer from "@/components/drag/drag_file_container";
import Window from "@/components/window/window";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import MenuBox from "@/components/menu/menu_box";
import { createWindowKey } from "@/utils/random_key";
import { WindowType } from "@/interfaces/window";
import { fileApi, memberApi } from "@/api/fetch";
import { redirect, RedirectType } from "next/navigation";
import { normalRetryCount, normalStaleTime } from "@/api/query";
import { ApiFileType } from "@/interfaces/api";

export default function Home() {
  // Constants
  const backgroundWindowKey = useMemo(() => createWindowKey(), []);

  // States
  const [homeKey, setHomeKey] = useState<string | null>(null);

  // Store states
  const windows = useWindowStore((state) => state.windows);
  // Store actions
  const newBackgroundWindow = useWindowStore((state) => state.newWindow);
  const setCurrentWindow = useWindowStore((state) => state.setCurrentWindow);

  // Refs
  const backgroundWindowRef = useRef(null);

  // Queries
  const queryClient = useQueryClient();
  const homeKeyQuery = useQuery<
    {
      fileKey: string;
      fileName: string;
      type: ApiFileType;
    },
    number
  >({
    queryKey: ["file", "home"],
    queryFn: async () => {
      const response = await fileApi.read.home();
      if (response.ok && response.body) {
        return response.body.data;
      } else {
        return Promise.reject(response.status);
      }
    },
    retry: normalRetryCount,
    staleTime: normalStaleTime,
  });
  const getMemberQuery = useQuery<
    {
      uuidKey: string;
    },
    number
  >({
    queryKey: ["member"],
    queryFn: async () => {
      const response = await memberApi.get();
      if (response.ok && response.body) {
        return response.body.data;
      } else {
        return Promise.reject(response.status);
      }
    },
    retry: normalRetryCount,
    staleTime: normalStaleTime,
  });
  const createMemberMutation = useMutation({
    mutationKey: ["member", "create"],
    mutationFn: async () => {
      const response = await memberApi.create();
      if (response.ok && response.body) {
        return response.body.data;
      } else {
        return Promise.reject(response.status);
      }
    },
    retry: normalRetryCount,
  });

  useEffect(() => {
    if (homeKey) {
      newBackgroundWindow({
        targetKey: homeKey,
        type: WindowType.Background,
        title: "background",
        key: backgroundWindowKey,
      });
    }
  }, [backgroundWindowKey, backgroundWindowRef, newBackgroundWindow, homeKey]);

  useEffect(() => {
    if (homeKeyQuery.isSuccess && homeKeyQuery.data) {
      setHomeKey(homeKeyQuery.data.fileKey);
    }
  }, [homeKeyQuery.data, homeKeyQuery.isSuccess]);

  useEffect(() => {
    if (homeKeyQuery.isError) {
      const redirectUri = process.env.NEXT_PUBLIC_REDIRECT_URI;
      if (homeKeyQuery.error === 401 && redirectUri) {
        redirect(redirectUri, RedirectType.push);
      } else if (
        homeKeyQuery.error === 403 &&
        getMemberQuery.isError &&
        getMemberQuery.error === 404 &&
        !createMemberMutation.isPending
      ) {
        // If the user is not a member of the service, create a member
        createMemberMutation
          .mutateAsync()
          .then(() => {
            queryClient.invalidateQueries();
          })
          .catch(() => {
            throw new Error("Failed to create member");
          });
      } else if (homeKeyQuery.error === 403 && getMemberQuery.isSuccess) {
        throw new Error("You are not a member of this service");
      } else {
        throw new Error("Failed to get home");
      }
    }
  }, [
    createMemberMutation,
    getMemberQuery.error,
    getMemberQuery.isError,
    getMemberQuery.isSuccess,
    homeKeyQuery.error,
    homeKeyQuery.isError,
    queryClient,
  ]);

  const onMouseEnter = useCallback(() => {
    setCurrentWindow({
      key: backgroundWindowKey,
      windowRef: backgroundWindowRef,
      contentRef: null,
      headerRef: null,
    });
  }, [backgroundWindowKey, backgroundWindowRef, setCurrentWindow]);

  if (homeKeyQuery.isLoading || !homeKey) {
    return <div></div>;
  }

  return (
    <div
      className={`${styles.page} flex-center full-size`}
      onContextMenu={(e) => e.preventDefault()}
    >
      <Background>
        <MenuBox>
          <SelectBoxContainer>
            <DragFileContainer>
              <div
                ref={backgroundWindowRef}
                className={`full-size flex-center ${styles.background_window}`}
                onMouseEnter={onMouseEnter}
              >
                <FileContainer
                  windowKey={backgroundWindowKey}
                  containerKey={homeKey}
                  upload
                  trash
                  backgroundFile
                />
              </div>
              {windows
                .filter((w) => w.type !== WindowType.Background)
                .map((window) => (
                  <Window key={window.key} windowKey={window.key} />
                ))}
            </DragFileContainer>
          </SelectBoxContainer>
        </MenuBox>
      </Background>
      <Navbar windows={windows} />
    </div>
  );
}
