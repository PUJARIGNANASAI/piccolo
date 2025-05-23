/*
Copyright 2017-2024 SensiML Corporation

This file is part of SensiML™ Piccolo AI™.

SensiML Piccolo AI is free software: you can redistribute it and/or
modify it under the terms of the GNU Affero General Public License
as published by the Free Software Foundation, either version 3 of
the License, or (at your option) any later version.

SensiML Piccolo AI is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public
License along with SensiML Piccolo AI. If not, see <https://www.gnu.org/licenses/>.
*/

import React, { useMemo } from "react";

import { DISABLED_FOR_CUSTOM_STEPS } from "store/autoML/const";
// eslint-disable-next-line import/extensions
import PipelineBuilder from "./PipelineBuilder";

const PipelineBuilderCustomTraining = (props) => {
  const { selectedSteps } = props;

  const getFilteredSelectedSteps = useMemo(() => {
    if (selectedSteps?.length) {
      // DISABLED_FOR_AUTOML_STEPS
      return selectedSteps.filter((step) => !DISABLED_FOR_CUSTOM_STEPS.includes(step.type));
    }
    return [];
  }, [selectedSteps]);

  return (
    <>
      <PipelineBuilder {...props} isAutoML={false} selectedSteps={getFilteredSelectedSteps} />
    </>
  );
};

export default PipelineBuilderCustomTraining;
