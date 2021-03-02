import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import { authProps, profileProps } from "../../../types.js";
import { Grid, Typography, Button } from "@material-ui/core";
import {
  NEW_COURSE_PAGE_HEADING,
  MANAGE_COURSES_PAGE_HEADING,
  POPUP_CANCEL_ACTION,
  POPUP_OK_ACTION,
  DISCARD_COURSE_CHANGES_POPUP_HEADER,
  EMPTY_COURSES_LIST_ADMIN,
  LOAD_MORE_TEXT,
} from "../../../config/strings.js";
import { useExecuteGraphQLQuery } from "../../CustomHooks.js";
import { Add, Done } from "@material-ui/icons";
import AppDialog from "../../Public/AppDialog.js";
import { makeStyles } from "@material-ui/styles";
const CourseEditor = dynamic(() => import("./CourseEditor.js"));
const CreatorCoursesList = dynamic(() => import("./CreatorCoursesList.js"));

const useStyles = makeStyles((theme) => ({
  header: {
    marginBottom: theme.spacing(1),
  },
}));

const CoursesManager = (props) => {
  const [coursesPaginationOffset, setCoursesPaginationOffset] = useState(1);
  const [creatorCourses, setCreatorCourses] = useState([]);
  const [courseEditorVisible, setCourseEditorVisible] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseEditorDirty, setCourseEditorDirty] = useState(false);
  const [userDismissingDirtyEditor, setUserDismissingDirtyEditor] = useState(
    false
  );
  const executeGQLCall = useExecuteGraphQLQuery();
  const classes = useStyles();

  useEffect(() => {
    loadCreatorCourses();
  }, [props.profile.id]);

  const loadCreatorCourses = async () => {
    if (!props.profile.id) {
      return;
    }
    const query = `
    query {
      courses: getCreatorCourses(
        id: "${props.profile.id}",
        offset: ${coursesPaginationOffset}
      ) {
        id, title, featuredImage, isBlog
      }
    }
    `;
    try {
      const response = await executeGQLCall(query);
      if (response.courses && response.courses.length > 0) {
        setCreatorCourses([...creatorCourses, ...response.courses]);
        setCoursesPaginationOffset(coursesPaginationOffset + 1);
      }
    } catch (err) {}
  };

  const showEditor = (courseId) => {
    if (courseEditorVisible) {
      if (courseEditorDirty) {
        setUserDismissingDirtyEditor(true);
      } else {
        setCourseEditorVisible(false);
      }
    } else {
      setSelectedCourse(courseId);
      setCourseEditorVisible(true);
    }
    // courseId && router.push(`/dashboard/courses/edit/${courseId}`)
  };

  const markDirtyEditorClean = () => setUserDismissingDirtyEditor(false);

  const dismissEditor = () => {
    setUserDismissingDirtyEditor(false);
    setCourseEditorDirty(false);
    setCourseEditorVisible(false);
  };

  return (
    <div>
      <Grid
        container
        direction="row"
        justify="space-between"
        alignItems="center"
        className={classes.header}
      >
        <Grid item>
          <Typography variant="h1">
            {courseEditorVisible
              ? NEW_COURSE_PAGE_HEADING
              : MANAGE_COURSES_PAGE_HEADING}
          </Typography>
        </Grid>
        <Grid item>
          <Button
            variant="contained"
            color={courseEditorVisible ? "secondary" : "primary"}
            onClick={() => showEditor()}
          >
            {courseEditorVisible ? <Done /> : <Add />}
          </Button>
        </Grid>
      </Grid>
      <>
        {!courseEditorVisible && (
          <>
            {creatorCourses.length > 0 && (
              <Grid container direction="column" spacing={2}>
                <Grid item>
                  <CreatorCoursesList
                    courses={creatorCourses}
                    onClick={showEditor}
                  />
                </Grid>
                <Grid item>
                  <Button onClick={loadCreatorCourses}>{LOAD_MORE_TEXT}</Button>
                </Grid>
              </Grid>
            )}
            {creatorCourses.length <= 0 && (
              <Typography variant="body1">
                {EMPTY_COURSES_LIST_ADMIN}
              </Typography>
            )}
          </>
        )}
        {courseEditorVisible && (
          <CourseEditor
            courseId={selectedCourse}
            markDirty={setCourseEditorDirty}
            closeEditor={showEditor}
          />
        )}
      </>
      <AppDialog
        onOpen={userDismissingDirtyEditor}
        onClose={markDirtyEditorClean}
        title={DISCARD_COURSE_CHANGES_POPUP_HEADER}
        actions={[
          { name: POPUP_CANCEL_ACTION, callback: markDirtyEditorClean },
          { name: POPUP_OK_ACTION, callback: dismissEditor },
        ]}
      ></AppDialog>
    </div>
  );
};

CoursesManager.propTypes = {
  auth: authProps,
  profile: profileProps,
  dispatch: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  auth: state.auth,
  profile: state.profile,
});

const mapDispatchToProps = (dispatch) => ({
  dispatch: dispatch,
});

export default connect(mapStateToProps, mapDispatchToProps)(CoursesManager);
