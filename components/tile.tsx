import pushid from 'pushid';
import React, { ReactNode, useCallback, useLayoutEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import usePosition from '../hooks/usePosition';
import { queueReport, tryUnqueueReport } from '../services/report';
import TILES from '../services/tiles';
import { RootState } from '../store';
import { MatchDetails, matchToggled, tileClickCancelled, tilePendingClickResolution } from '../store/boardSlice';
import { setAutoLocation } from '../store/configSlice';
import { AskToReport } from './ask-to-report';
import { GatherTileDetailsModal, TileDetails } from './gather-tile-details-modal';
import styles from './tile.module.css';

// The Tile is a state machine that progresses using clicks, some helper
// dialogs, and a useLayoutEvent().
enum TileState {
  UNMATCHED = "unmatched",
  UNMATCHED_CLICKED = "unmatched_clicked",
  SHOULD_SEND_REPORT = "should_send_report",
  DECIDE_HOW_TO_GET_DETAILS = "decide_how_to_get_details",
  DECIDE_HOW_TO_GET_DETAILS_REPORT = "decide_how_to_get_details_report",
  DECIDE_HOW_TO_GET_DETAILS_NOREPORT = "decide_how_to_get_details_noreport",
  /** Shows the `<GatherTileDetailsModal>` dialog, which can gather a location
   * from the user for a report, and/or get the detail string for the
   * Add-Your-Own tiles. */
  GET_DETAILS = "get_details",
  GETTING_LOCATION = "getting_location",
  DETAILS_COMPLETE = "details_complete",
  CANCELING_MATCH_CLICK = "canceling_match_click",
  MATCHED = "matched",
  MATCHED_CLICKED = "matched_clicked",
}

export default function Tile({ tileindex, tileid, matched }: {
  tileindex: number;
  tileid: number;
  matched: MatchDetails;
}): JSX.Element {
  const tile = TILES[tileid];
  const dispatch = useDispatch();
  const [state, setState] = useState(matched.match ? TileState.MATCHED : TileState.UNMATCHED);
  const [reportId, setReportId] = useState<string | undefined>(undefined);
  const [tileDetails, setTileDetails] = useState<TileDetails>({
    textLocation: "",
    detailString: matched.details,
  });

  const config = useSelector((state: RootState) => state.config);
  const db = useSelector((state: RootState) => state.db);
  if (db.state === "loading" || config.state === "loading") {
    throw new Error("Can't render tiles while state is loading.");
  }
  const { sendReports, autoLocation } = config;

  const onClick = useCallback(() => {
    switch (state) {
      case TileState.UNMATCHED:
        setState(TileState.UNMATCHED_CLICKED);
        break;
      case TileState.MATCHED:
        setState(TileState.MATCHED_CLICKED);
        break;
    }
  }, [state]);

  const askedAboutReport = useCallback((sendReports: boolean) => {
    if (sendReports) {
      setState(TileState.DECIDE_HOW_TO_GET_DETAILS_REPORT);
    } else {
      setState(TileState.DECIDE_HOW_TO_GET_DETAILS_NOREPORT);
    }
  }, []);

  const onGotTileDetails = useCallback(() => {
    setState(TileState.DETAILS_COMPLETE);
  }, []);

  const onDontReportTileDetails = useCallback(() => {
    setReportId(undefined);
    setState(TileState.DETAILS_COMPLETE);
  }, []);

  const onCanceledTileDetails = useCallback(() => {
    setState(TileState.CANCELING_MATCH_CLICK);
  }, []);

  const onPosition = useCallback((position) => {
    setTileDetails({ ...tileDetails, textLocation: undefined, location: position.coords });
    setState(TileState.DETAILS_COMPLETE);
  }, [tileDetails]);

  const onError = useCallback(() => {
    // On a geolocation error, turn off autolocation for the next tile click,
    // and don't report this obstruction.
    setReportId(undefined);
    dispatch(setAutoLocation(false));
    setState(TileState.DETAILS_COMPLETE);
  }, [dispatch]);

  const { permissionState: geolocationPermissionState } = usePosition({
    requestNow: state === TileState.GETTING_LOCATION,
    onPosition, onError
  });

  // Drive the state machine:
  useLayoutEffect(() => {
    const abortController = new AbortController();
    switch (state) {
      case TileState.MATCHED:
        break;
      case TileState.UNMATCHED:
        break;
      case TileState.MATCHED_CLICKED: {
        if (tile.freeSquare) {
          // Ignore attempts to unmark the free square.
          setState(TileState.MATCHED);
          break;
        }
        if (matched.reportId !== undefined) {
          tryUnqueueReport(db.db, matched.reportId);
        }
        dispatch(matchToggled({ tileIndex: tileindex, newmatch: false }));
        setState(TileState.UNMATCHED);
        break;
      }
      case TileState.UNMATCHED_CLICKED: {
        setTileDetails({ textLocation: "" });
        dispatch(tilePendingClickResolution(tileindex));
        if (sendReports === undefined) {
          setState(TileState.SHOULD_SEND_REPORT);
        } else {
          setState(TileState.DECIDE_HOW_TO_GET_DETAILS);
        }
        break;
      }
      case TileState.SHOULD_SEND_REPORT: {
        // Progressed by the <AskToReport> dialog.
        break;
      }
      case TileState.DECIDE_HOW_TO_GET_DETAILS: {
        if (sendReports) {
          setState(TileState.DECIDE_HOW_TO_GET_DETAILS_REPORT);
        } else {
          setState(TileState.DECIDE_HOW_TO_GET_DETAILS_NOREPORT);
        }
        break;
      }
      case TileState.DECIDE_HOW_TO_GET_DETAILS_REPORT: {
        setReportId(pushid());
        if (!autoLocation || geolocationPermissionState === "denied" || tile.isAddYourOwn) {
          setState(TileState.GET_DETAILS);
        } else {
          setState(TileState.GETTING_LOCATION);
        }
        break;
      }
      case TileState.DECIDE_HOW_TO_GET_DETAILS_NOREPORT: {
        setReportId(undefined);
        if (tile.isAddYourOwn) {
          setState(TileState.GET_DETAILS);
        } else {
          setState(TileState.DETAILS_COMPLETE);
        }
        break;
      }
      case TileState.GET_DETAILS: {
        // Progressed by the <GatherTileDetailsModal> dialog.
        break;
      }
      case TileState.GETTING_LOCATION: {
        // Handled by usePosition() above.
        break;
      }
      case TileState.CANCELING_MATCH_CLICK: {
        dispatch(tileClickCancelled(tileindex));
        setState(TileState.UNMATCHED);
        break;
      }
      case TileState.DETAILS_COMPLETE: {
        if (reportId !== undefined) {
          queueReport(db.db, reportId, tile, tileDetails)
        }
        setState(TileState.MATCHED);
        setReportId(undefined);
        dispatch(matchToggled({
          tileIndex: tileindex,
          newmatch: true,
          reportId: reportId,
          details: tileDetails.detailString,
        }));
        break;
      }
      default: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _casesShouldBeExhausive: never = state;
      }
    }

    return (): void => { abortController.abort(); };
  }, [autoLocation, db.db, dispatch, geolocationPermissionState, matched.reportId, reportId, sendReports, state, tile, tileDetails, tileindex]);

  let resolveClickDialog: ReactNode = null;
  if (state === TileState.SHOULD_SEND_REPORT) {
    resolveClickDialog = <AskToReport onDone={askedAboutReport} />
  } else if (state === TileState.GET_DETAILS) {
    resolveClickDialog = <GatherTileDetailsModal
      tile={tile}
      onReport={onGotTileDetails} onDontReport={onDontReportTileDetails} onCancel={onCanceledTileDetails}
      tileDetails={tileDetails} setTileDetails={setTileDetails}
      sendReports={sendReports} />;
  }

  let drawMatched = null;
  let addYourOwnDetails = null;
  if ([TileState.MATCHED, TileState.GETTING_LOCATION, TileState.DETAILS_COMPLETE].includes(state) &&
    !tile.freeSquare) {
    drawMatched = <img alt="Marked" src="tiles/marked.svg" className={styles.markedImg} />;
    if (tile.isAddYourOwn) {
      const details = tileDetails.detailString;
      if (details === undefined) {
        console.error("Marked Add-Your-Own tile is missing details.");
      }
      addYourOwnDetails = <div className={styles.addYourOwnDetailsDiv}>
        <p>{details}</p>
      </div>;
    }
  }

  return <td onClick={onClick} className={styles.tileCell}>
    <img alt={tile.alt} src={`/tiles/${tile.image}`} className={styles.tileImg} />
    {resolveClickDialog}
    {drawMatched}
    {addYourOwnDetails}
  </td>;
}
